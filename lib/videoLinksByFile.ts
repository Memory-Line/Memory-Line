// YouTube videos attached automatically when a worksheet is uploaded,
// keyed by category and then by the worksheet's exact file name (from the
// video index supplied with each pack). Large print versions attach to
// their worksheet, so they pick up the same video.
export const VIDEO_LINKS_BY_FILE: Record<string, Record<string, string>> = {
  "Sing-Alongs": {
    "001-moonlight-bay-singalong.pdf": "https://www.youtube.com/watch?v=fTg6lw4O0w4",
    "002-pack-up-your-troubles-singalong.pdf": "https://www.youtube.com/watch?v=USTf1dkXmSE",
    "003-it-s-a-long-way-to-tipperary-singalong.pdf": "https://www.youtube.com/watch?v=y2bPUCOGDjw",
    "004-keep-the-home-fires-burning-singalong.pdf": "https://www.youtube.com/watch?v=U1Vv9a4w_wc",
    "005-if-you-were-the-only-girl-in-the-world-singalong.pdf": "https://www.youtube.com/watch?v=nyOIliG-Nb4",
    "006-ain-t-we-got-fun-singalong.pdf": "https://www.youtube.com/watch?v=Mdzk3L5kJqo",
    "007-avalon-singalong.pdf": "https://www.youtube.com/watch?v=PNDbfg7NVr8",
    "008-the-band-played-on-singalong.pdf": "https://www.youtube.com/watch?v=dLQjRpwTneg",
    "009-by-the-light-of-the-silvery-moon-singalong.pdf": "https://www.youtube.com/watch?v=3ONuZ5vEhqY",
    "010-yes-sir-that-s-my-baby-singalong.pdf": "https://www.youtube.com/watch?v=w8FUUI7oe2w",
    "011-let-me-call-you-sweetheart-singalong.pdf": "https://www.youtube.com/watch?v=nwiIOPzvTkk",
    "012-danny-boy-singalong.pdf": "https://www.youtube.com/watch?v=F4yv5AuTA9o",
    "013-school-days-singalong.pdf": "https://www.youtube.com/watch?v=kmUx6Dvxb9Q",
    "014-smiles-singalong.pdf": "https://www.youtube.com/watch?v=63Bi46xjvmE",
    "015-too-ra-loo-ra-loo-ral-singalong.pdf": "https://www.youtube.com/watch?v=G8Q3YgOSo8k",
    "016-you-made-me-love-you-singalong.pdf": "https://www.youtube.com/watch?v=Nlf0ON-Yp-U",
    "017-oh-you-beautiful-doll-singalong.pdf": "https://www.youtube.com/watch?v=vhm925fEbbI",
    "018-the-sidewalks-of-new-york-singalong.pdf": "https://www.youtube.com/watch?v=ev7ut_4SmTo",
    "019-till-we-meet-again-singalong.pdf": "https://www.youtube.com/watch?v=1H9pmi0bd3I",
    "020-i-ll-take-you-home-again-kathleen-singalong.pdf": "https://www.youtube.com/watch?v=LGbNvGtAMWg",
    "021-my-blue-heaven-singalong.pdf": "https://www.youtube.com/watch?v=GPXONLwagXk",
    "022-charleston-singalong.pdf": "https://www.youtube.com/watch?v=SGgX-eWSn4I",
    "023-april-showers-singalong.pdf": "https://www.youtube.com/watch?v=Agpro3-pWG0",
  },
};

export function videoUrlFor(category: string, fileName: string): string | null {
  return VIDEO_LINKS_BY_FILE[category]?.[fileName] ?? null;
}
