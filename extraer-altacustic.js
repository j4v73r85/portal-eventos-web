async function main() {
    const url = 'https://surtdecasa.cat/camp/agenda/2026/festival-altacustic/262718';
    const res = await fetch(url);
    const html = await res.text();

    const nums = html.match(/[-]?\d{1,2}\.\d{4,}/g) || [];
    const unicos = [...new Set(nums)];

    const imageMatches = html.match(/https:\/\/surtdecasa\.cat\/sites\/default\/files[^"\s]+/gi) || [];
    const images = [...new Set(imageMatches)];

    const outLinks = [...html.matchAll(/href="(https?:\/\/[^"]+)"[^>]*target="_blank"/gi)].map((m) => m[1]);
    const outUnicos = [...new Set(outLinks)];

    const snippet = (html.match(/MÚSICA[\s\S]{0,380}/i) || [])[0] || '';

    console.log('COORD_CANDIDATAS:', unicos);
    console.log('IMAGENES:', images);
    console.log('OUT_LINKS:', outUnicos.slice(0, 20));
    console.log('SNIPPET:', snippet.replace(/\s+/g, ' '));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
