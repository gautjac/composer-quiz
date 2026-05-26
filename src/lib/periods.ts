export interface Period {
  id: string;
  name: string;
  dates: string;
  description: string;
  longDescription: string;
}

export const PERIODS: Period[] = [
  {
    id: "medieval",
    name: "Medieval",
    dates: "c. 500–1400",
    description:
      "The thousand years from Gregorian chant to the first written polyphony — Western music's long, monastic apprenticeship.",
    longDescription:
      "Medieval music is mostly the music of the Church. Plainchant — single-line, unmeasured, modal — was its dominant idiom for half a millennium. The 9th century saw the first systematic polyphony (organum); the 12th and 13th brought the Notre-Dame school of Léonin and Pérotin, whose massive vocal architectures invented Western harmony as we now know it. The 14th-century Ars Nova — Machaut its central figure — introduced rhythmic complexity, secular love songs, and the polyphonic mass as a unified cycle. Hildegard von Bingen, working a century earlier in the Rhineland, stands apart: a visionary abbess whose ecstatic monophonic chants have re-entered the active repertoire only in our lifetime.",
  },
  {
    id: "renaissance",
    name: "Renaissance",
    dates: "c. 1400–1600",
    description:
      "Vocal polyphony reaches its perfection: smooth-flowing lines, imitative entries, a cappella choral splendour.",
    longDescription:
      "Renaissance composers — first in Burgundy, then increasingly in Italy and northern Europe — refined the imitative polyphonic style into one of the most disciplined choral idioms ever written. Josquin des Prez was its central figure around 1500; Palestrina its conservative summit a generation later, his name synonymous with the strict counterpoint Rome adopted as the church's official style after Trent. England produced Tallis and Byrd, whose Catholic devotional music survived the Reformation in private; Italy produced Gesualdo, whose extraordinary chromaticism makes him sound nearly modern. Secular forms — the madrigal, the chanson — flourished alongside the sacred. By 1600 a new generation, Monteverdi at its head, was preparing to demolish the whole edifice.",
  },
  {
    id: "baroque",
    name: "Baroque",
    dates: "c. 1600–1750",
    description:
      "Opera, the concerto, the fugue, and the basso continuo — music suddenly has a beat, a bassline, and high drama.",
    longDescription:
      "The Baroque era begins with Monteverdi (whose 'Orfeo' of 1607 is the first opera that still holds the stage) and ends with Bach's death in 1750. Across those 150 years music acquired the basso continuo (a continuous bass line with figured-bass harmonies played by harpsichord or organ and a melody bass instrument), tonal harmony based on functional chord progressions, and a whole new set of forms: the opera, the oratorio, the concerto grosso and solo concerto, the suite, the sonata, the cantata, the fugue. Italy led; France developed a distinct national style; Germany absorbed both and culminated in Bach's encyclopedic synthesis. Handel meanwhile decamped to London and remade English oratorio. Vivaldi wrote 500 concertos. The age's defining sound: ornamented melody over a moving bass.",
  },
  {
    id: "classical",
    name: "Classical",
    dates: "c. 1750–1820",
    description:
      "Symmetry, balance, and the perfecting of the symphony, string quartet, and sonata under Haydn, Mozart, and Beethoven.",
    longDescription:
      "The Classical era is shorter than either of its neighbours but produced an outsized share of the canon. Haydn — court Kapellmeister at the Esterházy palaces for thirty years — codified the symphony and string quartet, writing 104 and 68 of them respectively. Mozart, his protégé and equal, brought to those forms a melodic and dramatic genius unmatched before or since. Beethoven, half a generation younger, started inside the Classical idiom and dynamited it from within across his three creative periods. The era's hallmark: clear formal structures (sonata form above all), balanced phrases, regular periodic rhythm, a galant clarity of texture. By the 1820s Beethoven's late quartets had already broken these conventions beyond repair.",
  },
  {
    id: "romantic",
    name: "Romantic",
    dates: "c. 1820–1900",
    description:
      "Music expands: longer, louder, more chromatic, more autobiographical, more nationalistic.",
    longDescription:
      "Romanticism extended every dimension Classical composers had defined. Symphonies grew from twenty-five to ninety minutes; orchestras from sixty to a hundred-twenty players; harmony from diatonic functional to relentlessly chromatic. Schubert wrote 600 songs that quietly revolutionised the relation between voice and piano. Chopin made the piano sing as no one had before. Liszt invented the symphonic poem and the modern piano recital. Wagner consumed the opera house with the Ring cycle and the Tristan chord. Brahms wrote symphonies that argued with Beethoven for forty years. The Russians — Tchaikovsky, Mussorgsky, Borodin, Rimsky-Korsakov — produced a distinct national school. Nationalism, programme music, virtuoso performance, the cult of the artist as solitary genius — all distinguishing marks of the age.",
  },
  {
    id: "late-romantic",
    name: "Late Romantic",
    dates: "c. 1880–1920",
    description:
      "Romanticism pushed to its extreme — vast orchestras, hour-long symphonies, harmony reaching its tonal breaking point.",
    longDescription:
      "The generation that straddled the turn of the 20th century inherited Wagner's chromatic vocabulary and pushed it to a place where tonality itself began to dissolve. Mahler wrote nine completed symphonies, several of them longer and louder than any before, that strain to contain everything from peasant dances to mystical visions of redemption. Strauss's tone poems made the orchestra a virtuoso narrative engine. Bruckner wrote vast, slow, deeply religious symphonies that made many of his contemporaries restless. Sibelius distilled the Romantic idiom into something tauter and more austere. Puccini's Italian operas — 'La Bohème,' 'Tosca,' 'Madama Butterfly' — perfected the heart-on-sleeve lyric style. The end of the era ushers in two responses: Schoenberg's atonal break and Debussy's impressionist alternative.",
  },
  {
    id: "impressionism",
    name: "Impressionism",
    dates: "c. 1880–1920",
    description:
      "Debussy's quiet revolution: parallel chords, exotic scales, music as colour and atmosphere rather than narrative argument.",
    longDescription:
      "French Impressionism emerged in the 1890s as a deliberate alternative to German chromatic late-Romanticism. Debussy — the central figure — drew on the whole-tone scale, modal harmony, Javanese gamelan he heard at the 1889 Paris exhibition, and the non-functional chord-stream that gives his piano music its characteristic shimmer. The aim was not psychological argument but evocation of mood, place, atmosphere — 'La Mer,' 'Prélude à l'après-midi d'un faune,' 'Estampes.' Ravel, half a generation younger, shared the harmonic vocabulary but was a more precise classicist by temperament. Satie — eccentric, ironic, ascetic — supplied the movement's anti-Romantic conscience. Fauré, slightly older, bridged Romantic and Impressionist sensibilities in his exquisite chamber works.",
  },
  {
    id: "modernism",
    name: "Modernism",
    dates: "c. 1900–1945",
    description:
      "The 20th-century break with tonality — Stravinsky, Schoenberg, Bartók remake the rhythmic and harmonic vocabulary of Western music.",
    longDescription:
      "Modernism in music begins around 1908 — Schoenberg's leap into 'free atonality,' Stravinsky's 'Firebird' soon followed by 'Petrushka' and 'The Rite of Spring' (which provoked the most famous riot in concert history at its 1913 premiere). The shared project was an emancipation from the assumptions of tonal Romanticism: new rhythmic complexity, new chord vocabularies, new ways of organising large structures. Schoenberg's twelve-tone method (mid-1920s) gave atonal music a systematic basis his students Berg and Webern developed in different directions. Bartók fused folk modality with Modernist rigour. Prokofiev and Shostakovich worked under Soviet constraint that gave their music a distinct ironic edge. Two world wars frame the era; the music that emerged remade what 'serious music' could sound like.",
  },
  {
    id: "post-1945",
    name: "Post-1945",
    dates: "c. 1945–1980",
    description:
      "The post-war avant-garde — Cage's chance, Boulez's total serialism, Messiaen's birdsong, Ligeti's clusters.",
    longDescription:
      "After 1945, European modernism reorganised at Darmstadt around total serialism (Boulez, Stockhausen) — the extension of Schoenberg's twelve-tone method to rhythm, dynamics, articulation, and timbre. America took different paths: John Cage embraced indeterminacy and Eastern philosophy, redefining what could count as music. Messiaen — Boulez's teacher, but his own thing entirely — built a vocabulary on modes of limited transposition, birdsong, and Catholic mysticism. Ligeti developed dense micropolyphonic textures (heard by millions through Kubrick's '2001'). Britten and Shostakovich kept tonality in distinguished use against the avant-garde tide. The era's loose unity: the conviction that, with the inherited tonal language exhausted, music had to invent its premises from scratch.",
  },
  {
    id: "contemporary",
    name: "Contemporary",
    dates: "c. 1960–present",
    description:
      "Minimalism and after — Reich and Glass invent a steady-pulse alternative; the field finally fragments beyond any one '-ism.'",
    longDescription:
      "Minimalism began in 1960s California — Riley's 'In C' (1964) is the foundational text — as a deliberate reaction against the complexity of post-war modernism. Steve Reich and Philip Glass developed it on the East Coast through the 1970s into the era's defining new style: steady pulse, slow harmonic change, additive process, audible repetition. John Adams and others extended it back toward tonal lyricism in the 1980s. Meanwhile, the Estonian Arvo Pärt and the Polish Henryk Górecki pursued a parallel 'holy minimalism' rooted in sacred chant. The Finnish Kaija Saariaho and the German Helmut Lachenmann represented other paths, neither serialist nor minimalist. Today contemporary classical music is genuinely pluralistic — there is no central style and no dominant figure.",
  },
];

export function getPeriodById(id: string): Period | undefined {
  return PERIODS.find((p) => p.id === id);
}
