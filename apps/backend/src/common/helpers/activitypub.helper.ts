import {
  Actor,
  Note,
  Create,
  Collection,
  CollectionPage,
  Webfinger,
} from "../types/activitypub.types.js";

export class ActivityPubHelper {
  /**
   * Build the actor URL from username and domain
   * Handles domains with or without protocol
   */
  private static getActorUrl(username: string, domain: string): string {
    // If domain already has protocol, use it as-is
    if (domain.startsWith("http://") || domain.startsWith("https://")) {
      return `${domain}/@${username}`;
    }
    // Otherwise determine protocol based on localhost
    const protocol = domain.includes("localhost") ? "http" : "https";
    return `${protocol}://${domain}/@${username}`;
  }

  /**
   * Generate Actor profile for a Fediverse account
   */
  static createActor(
    username: string,
    domain: string,
    displayName: string,
    summary: string | undefined,
    publicKeyPem: string,
    icon?: string,
  ): Actor {
    const id = this.getActorUrl(username, domain);
    const publicKeyId = `${id}#main-key`;

    return {
      "@context": [
        "https://www.w3.org/ns/activitystreams",
        "https://w3id.org/security/v1",
      ],
      type: "Person",
      id,
      name: displayName,
      preferredUsername: username,
      summary: summary || `Feed for ${displayName}`,
      icon: icon
        ? {
            type: "Image",
            url: icon,
          }
        : undefined,
      inbox: `${id}/inbox`,
      outbox: `${id}/outbox`,
      followers: `${id}/followers`,
      following: `${id}/following`,
      publicKey: {
        id: publicKeyId,
        owner: id,
        publicKeyPem,
      },
      url: id,
      discoverable: true,
      manuallyApprovesFollowers: false,
    };
  }

  /**
   * Create a Note (post) object
   */
  static createNote(
    accountId: string,
    accountName: string,
    domain: string,
    title: string,
    content: string,
    url: string,
    publishedAt: Date,
  ): Note {
    const actorUrl = this.getActorUrl(accountName, domain);
    const noteId = `${actorUrl}/${Date.now()}`;

    return {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Note",
      id: noteId,
      attributedTo: actorUrl,
      published: publishedAt.toISOString(),
      url: url,
      content: `<p>${this.escapeHtml(content)}</p>`,
      to: ["https://www.w3.org/ns/activitystreams#Public"],
    };
  }

  /**
   * Create a Create activity wrapping a Note
   */
  static createActivity(
    accountName: string,
    domain: string,
    note: Note,
  ): Create {
    const actorId = this.getActorUrl(accountName, domain);

    return {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Create",
      actor: actorId,
      object: note,
      published: note.published,
      to: note.to,
    };
  }

  /**
   * Create a Collection for outbox
   */
  static createCollection(
    accountName: string,
    domain: string,
    items: Create[],
    totalItems: number,
  ): Collection {
    const actorUrl = this.getActorUrl(accountName, domain);
    return {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      id: `${actorUrl}/outbox`,
      totalItems,
      items,
    };
  }

  /**
   * Create a Webfinger response for account discovery
   */
  static createWebfinger(username: string, domain: string): Webfinger {
    const subject = `acct:${username}@${domain.split("://").pop()?.split(":")[0] || domain}`;
    const actorUrl = this.getActorUrl(username, domain);

    return {
      subject,
      aliases: [actorUrl],
      links: [
        {
          rel: "self",
          type: "application/activity+json",
          href: actorUrl,
        },
        {
          rel: "http://webfinger.net/rel/profile-page",
          type: "text/html",
          href: actorUrl,
        },
      ],
    };
  }

  /**
   * Escape HTML to prevent XSS in posts
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
