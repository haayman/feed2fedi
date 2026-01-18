/**
 * ActivityPub JSON-LD types and interfaces
 */

export interface ActivityPubContext {
  "@context": string | string[];
}

export interface Actor extends ActivityPubContext {
  type: "Person" | "Service" | "Organization";
  id: string;
  name: string;
  preferredUsername: string;
  summary?: string;
  icon?: {
    type: "Image";
    url: string;
  };
  image?: {
    type: "Image";
    url: string;
  };
  inbox: string;
  outbox: string;
  followers?: string;
  following?: string;
  publicKey: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
  url?: string;
  published?: string;
  discoverable?: boolean;
  manuallyApprovesFollowers?: boolean;
}

export interface Activity extends ActivityPubContext {
  type: string;
  id?: string;
  actor: string | Actor;
  object: any;
  published?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
}

export interface Create extends Activity {
  type: "Create";
  object: Note;
}

export interface Note extends ActivityPubContext {
  type: "Note";
  id: string;
  attributedTo: string;
  inReplyTo?: string;
  published: string;
  url: string;
  content: string;
  to?: string[];
  cc?: string[];
}

export interface Collection extends ActivityPubContext {
  type: "Collection" | "OrderedCollection";
  id: string;
  totalItems: number;
  items: any[];
  first?: string;
  last?: string;
}

export interface CollectionPage extends ActivityPubContext {
  type: "CollectionPage" | "OrderedCollectionPage";
  id: string;
  partOf: string;
  totalItems?: number;
  items: any[];
  next?: string;
  prev?: string;
}

export interface Webfinger {
  subject: string;
  aliases?: string[];
  links: Array<{
    rel: string;
    type?: string;
    href?: string;
    template?: string;
  }>;
}
