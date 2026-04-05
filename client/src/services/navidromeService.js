export async function fetchAlbums(
    user,
    offset = 0
) {
    const url =
        `${user.serverUrl}/rest/getAlbumList2.view` +
        `?u=${encodeURIComponent(user.username)}` +
        `&s=${user.salt}` +
        `&t=${user.token}` +
        `&v=1.16.1` +
        `&c=binksconnect` +
        `&f=json` +
        `&type=alphabeticalByName` +
        `&size=50` +
        `&offset=${offset}`;

    const response = await fetch(url);
    const data = await response.json();

    return (
        data["subsonic-response"]
            ?.albumList2?.album || []
    );
}