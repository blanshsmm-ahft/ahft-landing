export interface Region {
    key: string;
    name: string;
    okrug: string;
    cx: number;
    cy: number;
    sales?: boolean;
    cities?: string[];
    shops?: { name: string; url: string }[];
}