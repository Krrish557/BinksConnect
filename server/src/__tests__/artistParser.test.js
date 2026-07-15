const { parseArtists, getPrimaryArtist, normalizeArtistName } = require("../utils/artistParser");

describe("parseArtists", () => {
    test("splits on 'x'", () => {
        expect(parseArtists("Seedhe Maut x Krsna")).toEqual(["Seedhe Maut", "Krsna"]);
    });

    test("splits on 'feat.'", () => {
        expect(parseArtists("Artist A feat. Artist B")).toEqual(["Artist A", "Artist B"]);
    });

    test("splits on 'ft'", () => {
        expect(parseArtists("Artist A ft Artist B")).toEqual(["Artist A", "Artist B"]);
    });

    test("splits on '&'", () => {
        expect(parseArtists("Artist A & Artist B")).toEqual(["Artist A", "Artist B"]);
    });

    test("splits on 'vs'", () => {
        expect(parseArtists("Artist A vs Artist B")).toEqual(["Artist A", "Artist B"]);
    });

    test("splits on 'with'", () => {
        expect(parseArtists("Artist A with Artist B")).toEqual(["Artist A", "Artist B"]);
    });

    test("splits on comma", () => {
        expect(parseArtists("Artist A, Artist B")).toEqual(["Artist A", "Artist B"]);
    });

    test("splits on slash", () => {
        expect(parseArtists("Artist A / Artist B")).toEqual(["Artist A", "Artist B"]);
    });

    test("single artist passthrough", () => {
        expect(parseArtists("A.R. Rahman")).toEqual(["A.R. Rahman"]);
    });

    test("handles 'Various Artists' as special case", () => {
        expect(parseArtists("Various Artists")).toEqual(["Various Artists"]);
        expect(parseArtists("various artists")).toEqual(["Various Artists"]);
    });

    test("returns empty array for null/empty/whitespace", () => {
        expect(parseArtists(null)).toEqual([]);
        expect(parseArtists("")).toEqual([]);
        expect(parseArtists("   ")).toEqual([]);
    });

    test("returns original string if non-string input", () => {
        expect(parseArtists(123)).toEqual([]);
        expect(parseArtists(undefined)).toEqual([]);
    });

    test("deduplicates same artist names", () => {
        expect(parseArtists("Artist A, Artist A")).toEqual(["Artist A"]);
    });

    test("trims whitespace from parts", () => {
        expect(parseArtists("  Artist A  x  Artist B  ")).toEqual(["Artist A", "Artist B"]);
    });
});

describe("getPrimaryArtist", () => {
    test("returns first artist from collaboration", () => {
        expect(getPrimaryArtist("Seedhe Maut x Krsna")).toBe("Seedhe Maut");
    });

    test("returns single artist", () => {
        expect(getPrimaryArtist("A.R. Rahman")).toBe("A.R. Rahman");
    });

    test("returns raw input for empty/null", () => {
        expect(getPrimaryArtist(null)).toBe(null);
        expect(getPrimaryArtist("")).toBe("");
    });
});

describe("normalizeArtistName", () => {
    test("trims, lowercases, collapses whitespace", () => {
        expect(normalizeArtistName("  A.R.  Rahman  ")).toBe("a.r. rahman");
    });

    test("returns empty string for null/non-string", () => {
        expect(normalizeArtistName(null)).toBe("");
        expect(normalizeArtistName(123)).toBe("");
    });

    test("collapses multiple spaces", () => {
        expect(normalizeArtistName("Artist    Name")).toBe("artist name");
    });
});
