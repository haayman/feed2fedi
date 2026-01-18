import {
  Actor,
  Note,
  Create,
  Collection,
  CollectionPage,
  Webfinger,
} from '../types/activitypub.types.js';

export class ActivityPubHelper {
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
    const id = `https://${domain}/@${username}`;
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
    const noteId = `https://${domain}/@${accountName}/${Date.now()}`;

    return {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Note",
      id: noteId,
      attributedTo: `https://${domain}/@${accountName}`,
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
    const actorId = `https://${domain}/@${accountName}`;

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
    return {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      id: `https://${domain}/@${accountName}/outbox`,
      totalItems,
      items,
    };
  }

  /**
   * Create a Webfinger response for account discovery
   */
  static createWebfinger(username: string, domain: string): Webfinger {
    const subject = `acct:${username}@${domain}`;
    const actorUrl = `https://${domain}/@${username}`;

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
