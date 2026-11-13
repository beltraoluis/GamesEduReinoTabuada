export const PROFANITY_MESSAGE = 'Ops! Esse nome não pode ser usado. Que tal tentar outro bem legal? 😊';

type LanguageWordList = {
  wholeToken: readonly string[];
  substring: readonly string[];
};

const PT_PROFANITY_WORDS: LanguageWordList = {
  wholeToken: [
    'puto', 'putos', 'foda', 'fode', 'foder', 'fodido', 'fodida',
    'cu', 'cus', 'pau', 'fdp', 'pqp', 'vsf', 'tnc', 'pnc', 'rola',
    'sexo', 'penis', 'anal', 'anus', 'gozar', 'gozo', 'tesao',
    'babaca', 'imbecil', 'otario', 'otaria', 'cretino', 'cretina',
    'trouxa', 'burro', 'burra', 'retardado', 'retardada', 'escroto', 'escrota',
    'fudeu', 'fudido', 'viado', 'fudida', 'carai', 'caraio', 'bicha',
    'krl', 'vtnc', 'tmnc', 'xana', 'vadia',
  ],
  substring: [
    'pvta', 'idiota', 'fodase', 'cacete', 'piroca', 'vagina', 'xoxota', 'xereca', 'cuzao',
    'kralho', 'mierda', 'cuzinho', 'puta', 'porra', 'merda', 'bosta', 'buceta',
    'boceta', 'caralho', 'caralha', 'karalho', 'buketa', 'tomanocu',
    'arrombado', 'arrombada', 'desgracado', 'desgracada', 'vagabundo', 'vagabunda', 'punheta',
  ],
};
const EN_PROFANITY_WORDS: LanguageWordList = {
  wholeToken: [
    'shit', 'azz', 'ass', 'dick', 'cock', 'cum', 'sex', 'pussy', 'slut', 'whore',
    'crap', 'damn', 'hell', 'bollocks', 'bugger', 'prick', 'twat', 'wank',
    'wanker', 'jerk', 'douche', 'douchebag', 'dipshit', 'dumbass', 'jackass',
    'piss', 'pissed', 'tits', 'titty', 'boobs', 'boob', 'boner', 'penis',
    'blowjob', 'handjob', 'rimjob', 'orgasm', 'porn', 'porno', 'horny',
    'arse', 'shag', 'bellend', 'tosser', 'chink', 'spic', 'tranny', 'kys', 'omfg', 'lmfao',
    'wtf', 'stfu', 'gtfo', 'fml', 'spaz',
    'fag', 'dyke', 'nigga', 'kike',
  ],
  substring: ['fvck', 'retard', 'faggot', 'nigger', 'kike', 'arsehole', 'fack', 'phuck', 'fuk', 'fuq', 'cvnt', 'motherfuker', 'biatch', 'fuck', 'motherfucker', 'asshole', 'bitch', 'cunt', 'bastard', 'bullshit'],
};
const DE_PROFANITY_WORDS: LanguageWordList = {
  wholeToken: [
    'behindert', 'verfickt', 'gefickt', 'drecksau', 'miststuck', 'kruppel', 'huso', 'hdf',
    'oasch', 'wappler', 'trottl', 'beidl', 'fotzn', 'tschusch', 'huere', 'gopferdammi', 'fudi',
    'arsch', 'fick', 'hure', 'heure', 'nutte', 'wichser', 'wixxer', 'wichsen', 'wixen',
    'schlampe', 'schwuchtel', 'schwuchtler', 'spast', 'spasti', 'behindi',
    'idiot', 'idiotin', 'depp', 'trottel', 'dummkopf', 'blodmann', 'blodmannin',
    'blod', 'saublod', 'vollidiot', 'vollpfosten', 'mistkerl', 'drecksack',
    'dreckskerl', 'schwein', 'sau', 'pisser', 'pissen', 'kacke', 'kacken',
    'kackbratze', 'kotze', 'kotzen', 'pimmel', 'schwanz', 'muschi', 'titten',
    'fresse', 'schnauze', 'bimbo', 'kanake', 'neger', 'zigeuner',
  ],
  substring: [
    'scheisse', 'scheisze', 'arschloch', 'arschlocher', 'fotze', 'hurensohn',
    'hurentochter', 'ficken', 'fickdich', 'verpiss', 'missgeburt',
  ],
};
const IT_PROFANITY_WORDS: LanguageWordList = {
  wholeToken: [
    'vaffan', 'suca', 'diocane', 'dioporco', 'mona', 'fregna', 'scopare',
    'inculare', 'checca', 'bucaiolo', 'ciula', 'belin', 'cagare',
    'finocchio', 'culo', 'figa', 'fica', 'palle', 'balle', 'coglione', 'coglioni',
    'cretino', 'cretina', 'idiota', 'imbecille', 'deficiente', 'stupido',
    'stupida', 'scemo', 'scema', 'pirla', 'bastardo', 'bastarda', 'troia',
    'zoccola', 'baldracca', 'mignotta', 'sbagascia', 'frocio', 'frocetto',
    'ricchione', 'recchione', 'culattone', 'mongoloide', 'handicappato',
    'negro', 'terrone', 'zingaro', 'segaiolo', 'sega', 'seghe', 'sborra',
    'sborrata', 'tette', 'tettone', 'pompino', 'pompini', 'sesso',
    'porcodio', 'porcamadonna', 'vfc',
  ],
  substring: [
    'pvttana', 'vaffa', 'cazzo', 'cazzone', 'cazzata', 'vaffanculo', 'affanculo', 'stronzo',
    'stronza', 'puttana', 'puttanella', 'minchia', 'fanculo', 'cazzarola',
  ],
};

// Common words and names shared across the school's languages take priority.
const CROSS_LANGUAGE_INNOCENT_WORDS = new Set([
  'fica', 'pica', 'cola', 'bite', 'gift', 'mist', 'rat', 'fart', 
  'preto', 'gay', 'schwul', 'sega', 'balle', 'palle', 'bimbo',
  'hell', 'burro',
]);
// Exact ordinary names/words are exempt; adding an offensive suffix removes the exemption.
const INNOCENT_NAMES_AND_WORDS = new Set([
  'carvalho', 'carvalhal', 'porvir', 'porva', 'carvalhaes', 'carvalhosa', 'paulino', 'pauletti',
  'paulucci', 'paulon', 'pauleto', 'cury', 'curi', 'curti', 'curvelo', 'cutrim',
  'cunico', 'cusinato', 'cussi', 'cuoghi', 'cuccioli', 'cucolo', 'cuzzi', 'cuzzolin',
  'cazzolato', 'cunhambebe', 'cuiabano', 'assunta', 'rolla', 'dicksson', 'fickinger', 'pauls',
  'jass', 'cuti', 'cuzco', 'culver', 'curto', 'custo', 'curral', 'cuspir',
  'cursar', 'cubiculo', 'assim', 'assistir', 'assaltar', 'assassino', 'pausar', 'cumpri',
  'sextou', 'ana1',
  'calculo', 'circulo', 'seculo', 'musculo', 'veiculo', 'figado', 'iguacu', 'curioso',
  'assets', 'assist', 'cockpit', 'cockroach', 'cupcake', 'curious', 'brochure', 'unisex',
  'pause', 'spass', 'spass', 'nass', 'blass', 'fass', 'marsch', 'barsch',
  'assel', 'cuxhaven', 'dicker', 'paura', 'pausa', 'cucina', 'cuore', 'cugino',
  'cuoco', 'assisi', 'assai', 'assoluto', 'sfiga', 'cue', 'cueca', 'cuela',
  'paulinho', 'paulao', 'paulina', 'pauline', 'paulus', 'pauli', 'paulista', 'paul',
  'paul2', 'cuca', 'cunha', 'cunhado', 'cury', 'cuiaba', 'cutia', 'cusco',
  'assuncao', 'gass', 'tass', 'lass', 'hass', 'paulsen', 'paulson', 'dickinson',
  'sexton', 'cumberbatch', 'hitchcock', 'woodcock', 'cocker', 'pauta', 'pausa', 'pause',
  'cuidar', 'curso', 'cura', 'curva', 'cuspe', 'cuscuz', 'cubra', 'cumprir',
  'cumprimento', 'assado', 'assustado', 'assinatura', 'assombracao', 'glass', 'pass', 'brass',
  'assembly', 'assess', 'cucumber', 'cumin', 'cumulus', 'scum', 'hell', 'cuckoo',
  'culla', 'culinaria', 'ficus', 'fickle', 'cazzola', 'dickey', 'jazz',
  'lucas', 'lukas', 'paulo', 'paula', 'sexta', 'cuidado', 'cubo', 'cuco', 'culpa', 'escudo', 'escuta', 'cuba', 'curitiba',
  'cultura', 'curriculo', 'cumberland', 'culotta', 'assis', 'cassio', 'analu',
  'bass', 'mass', 'grass', 'class', 'assunto', 'assistant', 'classic',
  'hancock', 'peacock', 'cockburn', 'cocktail', 'dickens', 'dickson', 'cumming',
  'fickert', 'sussex', 'essex', 'middlesex', 'shitake', 'shiitake', 'pussycat',
  'scunthorpe', 'penistone', 'figaro',
]);
const EDGE_PROFANITY_WORDS = [
  'cu', 'cus', 'pau', 'fdp', 'azz', 'ass', 'dick', 'cock', 'cum', 'pussy', 'sex',
  'culo', 'figa', 'arsch', 'fick', 'hure', 'heure', 'shit',
];
const LANGUAGE_WORD_LISTS = [PT_PROFANITY_WORDS, EN_PROFANITY_WORDS, DE_PROFANITY_WORDS, IT_PROFANITY_WORDS];
const PROFANITY_WORDS = {
  wholeToken: [...new Set(LANGUAGE_WORD_LISTS.flatMap((language) => language.wholeToken))]
    .filter((word) => !CROSS_LANGUAGE_INNOCENT_WORDS.has(word)),
  substring: [...new Set(LANGUAGE_WORD_LISTS.flatMap((language) => language.substring))],
};

// Remove innocent stems, preserving any offensive text before or after them.
const INNOCENT_STEMS = /computa|disputa|deputa|reputa|imputa|amputa|resposta|reposta/g;

const LEET_LETTERS: Record<string, string> = {
  '2': 'z', '6': 'g', '8': 'b', '0': 'o', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's',
};
const CONFUSABLES: Record<string, string> = {
  'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y',
  'α': 'a', 'β': 'ss', 'ι': 'i', 'κ': 'k', 'μ': 'u', 'τ': 't', 'ı': 'i', 'і': 'i', 'ѕ': 's', 'ј': 'j', 'ο': 'o', 'υ': 'u', 'ν': 'v',
};
const intraWord = "[.\\-_*/,+'!|]*";
const repeatedLetters = (word: string): string[] =>
  word.replace(/(.)\1+/g, '$1').split('').map((letter) => `${letter}+`);
const pattern = (word: string): string => word === 'ass' ? 'a+s{2,}' : word === 'azz' ? 'a+z{2,}' : repeatedLetters(word).join(intraWord);
const INFLECTED_TERMS = new Set(['fag', 'slut', 'whore', 'retard', 'tosser', 'wanker', 'spic', 'chink']);
const tokenPattern = (word: string): string =>
  `${word === 'anal' ? repeatedLetters(word).join('') : pattern(word)}${INFLECTED_TERMS.has(word) ? '(?:s|es|er|en)?' : ''}`;
const wholeToken = new RegExp(`(?:^|[^a-z0-9])(?:${PROFANITY_WORDS.wholeToken.map((word) =>
  // Preserve names followed by an initial, such as Ana.L.
  tokenPattern(word)).join('|')})(?:$|[^a-z0-9])`);
const edgeTerms = EDGE_PROFANITY_WORDS.map(pattern).join('|');
const edgeTerm = new RegExp(`(?:^|[^a-z])(?:${edgeTerms})|(?:${edgeTerms})(?:$|[^a-z])`);
const spacedEdgeTerm = new RegExp(`(?:^|[^a-z0-9])(?:${EDGE_PROFANITY_WORDS.map((word) =>
  word.split('').map((letter) => `${letter}+`).join("[ .\\-_*/,+'!|]+")).join('|')})(?:$|[^a-z0-9])`);
const strongPattern = (word: string): string => repeatedLetters(word)
  .map((letter) => /^[aeiou]/.test(letter) ? `(?:${letter[0]}|[*+])+` : letter).join(intraWord);
const strongTerm = new RegExp(PROFANITY_WORDS.substring.map(strongPattern).join('|'));
const PHRASE_PATTERN = /(?:^|[^a-z0-9])(?:porco[ ._-]+dio|porca[ ._-]+madon+a|fick[ ._-]+dich)(?:$|[^a-z0-9])/;
const spacedStrongTerm = new RegExp(
  `(?:^|[^a-z0-9])(?:${[...PROFANITY_WORDS.substring, 'foda', 'fodase']
    .filter((word) => word.length >= 4)
    .map((word) => word.split('').map((letter) => `${letter}+`).join("[ .\\-_*/,+'!|]*"))
    .join('|')})(?:$|[^a-z0-9])`,
);

const germanWholeTerm = new RegExp(`(?:^|[^a-z0-9])(?:${DE_PROFANITY_WORDS.wholeToken
  .filter((word) => !CROSS_LANGUAGE_INNOCENT_WORDS.has(word)).map(tokenPattern).join('|')})(?:$|[^a-z0-9])`);
const germanStrongTerm = new RegExp(DE_PROFANITY_WORDS.substring.map(strongPattern).join('|'));
const germanTransliteration = (text: string): string => text.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');

function normalize(text: string, one: 'i' | 'l', preserveTrailingDigits = true): string {
  return text.normalize('NFKD').toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/sl8t/g, 'slut')
    .replace(/[\p{M}\p{Cf}]/gu, '')
    .replace(/\p{Extended_Pictographic}/gu, '.')
    .replace(/[аеорсхуіѕјουναβικμτı]/g, (character) => CONFUSABLES[character])
    // Standalone numbers and trailing scores remain numeric; internal digits can be leet.
    .replace(/[a-z023456781@$!|]+/g, (token) => {
      const numberedName = /^([a-z]{2,})[0-9]+$/.exec(token);
      if (numberedName && preserveTrailingDigits) return token;
      return /[a-z@$!|]/.test(token)
        ? token.replace(/[02345678@$]/g, (character) => LEET_LETTERS[character]).replace(/[1!|]/g, one)
        : token;
    });
}

function maskInnocentNames(normalized: string): string {
  return normalized.replace(/[a-z]+/g, (word) => INNOCENT_NAMES_AND_WORDS.has(word) ? ' ' : word);
}

function containsStrongTerm(normalized: string): boolean {
  const withoutInnocentStems = normalized.replace(INNOCENT_STEMS, ' ');
  return strongTerm.test(withoutInnocentStems) || spacedStrongTerm.test(withoutInnocentStems);
}

const INNOCENT_NAME_PAIRS = new Set(['ana l', 'anna l']);

// Remove only innocent starting stems for edge checks; offensive suffixes remain visible.
function maskInnocentEdgeStems(text: string): string {
  return text.replace(/[a-z]+/g, (word) =>
    word.replace(/^(?:paul|paus|paut|ass[aeiou]|cu(?:r|z|c|t|s|i|n|mp))/, ' '));
}

function matchesBlockedTerm(original: string, digitStripped = original): boolean {
  const normalized = maskInnocentNames(original);
  const germanTransliterated = germanTransliteration(normalized);
  const germanDigitsStripped = germanTransliteration(maskInnocentNames(digitStripped));
  return germanWholeTerm.test(germanTransliterated) || germanStrongTerm.test(germanTransliterated)
    || germanWholeTerm.test(germanDigitsStripped) || germanStrongTerm.test(germanDigitsStripped) || PHRASE_PATTERN.test(normalized) || wholeToken.test(normalized)
    || edgeTerm.test(maskInnocentEdgeStems(normalized)) || spacedEdgeTerm.test(normalized)
    || edgeTerm.test(maskInnocentEdgeStems(maskInnocentNames(digitStripped)))
    || containsStrongTerm(normalized) || containsStrongTerm(maskInnocentNames(digitStripped));
}

function hasBlockedFragments(normalized: string): boolean {
  const tokens = normalized.trim().split(/\s+/);
  if (tokens.filter((token) => /^[a-z]\.?$/.test(token)).length > 1) return true;
  for (let start = 0; start < tokens.length; start++) {
    if (!/^[a-z]+\.?$/.test(tokens[start])) continue;
    let joined = tokens[start].replace(/\.$/, '');
    for (let end = start + 1; end < tokens.length; end++) {
      if (!/^[a-z]+\.?$/.test(tokens[end])) break;
      const previous = tokens[end - 1].replace(/\.$/, '');
      const current = tokens[end].replace(/\.$/, '');
      if (previous.length > 3 && current.length > 3) break;
      joined += current;
      const pair = tokens.slice(start, end + 1).map((token) => token.replace(/\.$/, '')).join(' ');
      if (!INNOCENT_NAME_PAIRS.has(pair) && matchesBlockedTerm(joined)) return true;
    }
  }
  return false;
}

export function containsProfanity(text: string): boolean {
  const input = text.slice(0, 100);
  return (['i', 'l'] as const).some((one) => {
    const normalized = normalize(input, one);
    // A second strong-term-only pass handles digit noise between letters.
    const digitStripped = normalize(input.replace(/[0-9]/g, ''), one);
    const separatorStripped = normalize(input.replace(/[!|]/g, ''), one);
    return hasBlockedFragments(normalized) || matchesBlockedTerm(normalized, digitStripped)
      || matchesBlockedTerm(separatorStripped)
      || containsStrongTerm(maskInnocentNames(normalize(input, one, false)));
  });
}
