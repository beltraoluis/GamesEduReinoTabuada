import { describe, expect, it } from 'vitest';
import { containsProfanity, PROFANITY_MESSAGE } from './profanity';

describe('containsProfanity', () => {
  it.each([
    'Lucas', 'Luis', 'Luiza', 'Pedro', 'Cauã', 'Bianca', 'Cassia', 'Analu',
    'Raquel', 'Cecília', 'Assis', 'Bruna', 'Rapaz', 'Computador', 'Cuidado',
    'Cubo', 'Matemática', 'Escola', 'Culpa', 'Bosque', 'Ana Luiza', 'João Pedro',
    'Marcelo', 'Carolina', 'Ricardo', 'Pietro', 'Pietra', 'Paulo', 'Paula',
    'Francisco', 'Clara', 'Isadora', 'Cassiano', 'Cassie', 'Thomas', 'Susana',
    'Passarinho', 'Massa', 'Classe', 'Assunto', 'Disputa', 'Deputado', 'Reputação',
    'Acumular', 'Cultura', 'Currículo', 'Rolar', 'Picolé', 'Pintura', 'Espaço',
    'Ana L', 'Ana L.', 'Anna L', 'Ana.L', 'Ana_L', 'Ana 1', 'A 55',
    'Computadorzinho', 'Computaram', 'Computamos', 'Computando', 'Computadas',
    'Supercomputador', 'Minicomputador', 'Disputamos', 'Disputando', 'Deputadinho',
    'Imputabilidade', 'Imputações', 'Reputam', 'Reputando', 'Computador2',
    'Computador123', 'Deputada1', 'Cassio', 'Escuta', 'Putin', 'Escudo',
    'Computadores', 'Disputas', 'Deputada', 'Imputado',
    'Pi Ca',
    'Imputar', 'Imputável', 'Reputar', 'Amputar', 'Computação', 'Disputar',
    'Reposta', 'Resposta', 'Boston',
    'Scunthorpe', 'Sexta-feira', 'Analista', 'Banal', 'Paisagem', 'Lu 🦊', '',
  ])('accepts innocent name or word %s', (name) => {
    expect(containsProfanity(name)).toBe(false);
  });

  it.each([
    'Lucas cu', 'Lucas_cu', 'Lucas Cus', 'Lucas Pau', 'vai tomar no cu',
    'Maria Cu', 'Ana Pau', 'Lucas fdp', 'Lucas_fdp',
    'p o r r a', 'Lucas p u t a', 'f o d a s e', 'p-o-r-r-a', 'p.o.r.r.a',
    'p😀u😀t😀a', 'p\u00adu\u2060t\ufeffa', 'p\u200du\u200ct\u200ba', 'p\ufe0fu\ufe0ft\ufe0fa',
    'kralho', 'carai', 'caraio', 'mierda', 'fudida', 'cuzinho', 'Lucascacete',
    'Lucaspiroca', 'Lucasvagina', 'Lucasxoxota', 'Lucasxereca', 'Lucascuzao',
    'Mari A S S', 'Lucasfdp', 'Lucascu', 'cuLucas', 'f d p', 'Lucas f d p', 'c u',
    'Lucasass', 'assLucas', 'Lucas_fdp', '2cu', 'cu2', 'Lucas2fdp', 'f.d.p',
    'c.u', 'p.a.u', 'caralha', 'puta', 'PUTO', 'porra', 'bosta', 'merda', 'cu', 'foda', 'foder', 'fodido',
    'fdp', 'pqp', 'cacete', 'buceta', 'boceta', 'piroca', 'rola', 'pau',
    'sexo', 'pênis', 'vagina', 'anal', 'ânus', 'gozar', 'tesão', 'babaca',
    'idiota', 'imbecil', 'otário', 'cretino', 'trouxa', 'retardado',
    'escroto', 'caralho', 'arrombado', 'desgraçado', 'vagabunda', 'putaria',
    'punheta', 'fuck', 'shit', 'ass', 'bitch', 'you dick', 'cock', 'pussy', 'slut',
    'whore', 'motherfucker', 'asshole', 'filho da puta',
    'p.u.t.a', 'p-u-t-a', 'p_u_t_a', 'p u t a', 'puuuta', 'pooorrrra',
    'p0rr4', 'pu74', 'b0$74', 'c@r@lh0', 'm3rd4', 'b1tch', 'car41ho',
    'p.uuu.t.@', 'f_u_c_k', ' João puta ', 'Ana-fdp', 'SuperCaralho123',
    'computadorputa', 'computador merda', 'disputaputa', 'Lucasputa', 'Lucasmerda', 'Lucasporra2', 'tomanocu',
    'fudeu', 'fudido', 'viado', 'bicha', 'cuzão', 'xoxota', 'xereca',
    'krl', 'vtnc', 'tmnc', 'xana', 'vadia', 'karalho', 'buketa',
    'p1u1t1a', '1puta', 'ｐｕｔａ', '𝐩𝐮𝐭𝐚', 'ⓟⓤⓣⓐ', 'рutа', 'pυta',
    'xxarrombadaxx', 'p\u200bu\u200bt\u200ba',
  ])('blocks offensive word or disguise %s', (name) => {
    expect(containsProfanity(name)).toBe(true);
  });

  it('blocks Pau Lo because a separate whole token takes priority over guessing Paulo', () => {
    expect(containsProfanity('Pau Lo')).toBe(true);
    expect(containsProfanity('Paulo')).toBe(false);
  });

  it('caps work for very long inputs', () => {
    for (const letter of ['a', 'c', 'p', 'v']) {
      const start = performance.now();
      expect(containsProfanity(letter.repeat(10_000))).toBe(false);
      expect(performance.now() - start).toBeLessThan(50);
    }
  });

  it('offers a gentle Portuguese message without repeating the offending word', () => {
    expect(PROFANITY_MESSAGE).toContain('tentar outro');
    expect(containsProfanity(PROFANITY_MESSAGE)).toBe(false);
  });
});

const MULTILINGUAL_ACCEPTED = {
  pt: ['Cuidado', 'Cubo', 'Cuco', 'Culpa', 'Escudo', 'Escuta', 'Cuba', 'Curitiba', 'Lucas', 'Analu', 'Raquel'],
  en: ['Dickens', 'Richard', 'Hancock', 'Peacock', 'Cockburn', 'Scunthorpe', 'Assistant', 'Classic', 'Bass', 'Mass', 'Grass', 'Passion', 'Cocktail', 'Shitake', 'Titus', 'Analysis', 'Sussex', 'Essex', 'Middlesex', 'Penistone', 'Cumberland', 'Cumming', 'Dickson', 'Randy', 'Willy', 'Fanny', 'Pussycat'],
  de: ['Hans', 'Franz', 'Dieter', 'Gisela', 'Ursula', 'Fritz', 'Heidi', 'Lukas', 'Jürgen', 'Juergen', 'Schmidt', 'Müller', 'Mueller', 'Klara', 'Essen', 'Fickert'],
  it: ['Matteo', 'Giulia', 'Francesca', 'Cassandra', 'Cazzaniga', 'Giorgio', 'Luca', 'Fabio', 'Marco', 'Gianluca', 'Cosimo', 'Piccolo', 'Ciao', 'Scarpa', 'Culotta', 'Anna', 'Annalisa', 'Analena', 'Figaro'],
};
const MULTILINGUAL_BLOCKED = {
  pt: ['porra', 'buceta', 'caralho', 'arrombado', 'fdp', 'Lucasfdp', 'Lucascu', 'cuLucas', 'f d p', 'c u', 'p.u.t.a', 'p0rr4', 'puuuta', 'Lucasmerda'],
  en: ['fuck', 'shit', 'bitch', 'cunt', 'asshole', 'you dick', 'cock', 'pussy', 'whore', 'slut', 'bastard', 'motherfucker', 'wtf', 'stfu', 'retard', 'faggot', 'nigger', 'kike', 'f.u.c.k', 'sh1t', 'biiiitch', 'Lucasfuck', 'd1ck', 'Lucascock', 'Lucasass', 'a s s', 'Lucas2cum'],
  de: ['scheisse', 'scheiße', 'scheisze', 'sch3isse', 'arschloch', 'a-r-s-c-h', 'fotze', 'hurensohn', 'wichser', 'schlampe', 'ficken', 'fick dich', 'nutte', 'schwuchtel', 'verpiss dich', 'kanake', 'neger', 'spasti', 'blödmann', 'bloedmann', 'arschlöcher', 'arschloecher', 'sch.e.i.s.s.e', 'scheiiiisse', 'Hansscheisse', 'Lucasarsch', 'f1cken', 'f1ck', 'saublöd', 'saubloed'],
  it: ['cazzo', 'merda', 'vaffanculo', 'stronzo', 'puttana', 'troia', 'minchia', 'coglione', 'culo', 'figa', 'porco dio', 'porca madonna', 'frocio', 'ricchione', 'mongoloide', 'c.a.z.z.o', 'c4zzo', 'cazzzzo', 'puttttana', 'Lucascazzo', 'Lucasculo', 'vàffàncùlo'],
};

describe.each(Object.keys(MULTILINGUAL_ACCEPTED) as Array<keyof typeof MULTILINGUAL_ACCEPTED>)('language %s', (language) => {
  it.each(MULTILINGUAL_ACCEPTED[language])('accepts name or ordinary word %s', (name) => {
    expect(containsProfanity(name)).toBe(false);
  });
  it.each(MULTILINGUAL_BLOCKED[language])('blocks word or disguise %s', (word) => {
    expect(containsProfanity(word)).toBe(true);
  });
});

const LANGUAGE_JUDGMENTS = [
  ['Paulo', false, 'Common Portuguese name, exempt from the short-term edge rule.'],
  ['Paula', false, 'Common Portuguese name, exempt from the short-term edge rule.'],
  ['Sexta-feira', false, 'Ordinary Portuguese weekday, exempt from the short-term edge rule.'],
  ['Class', false, 'Ordinary English word, exempt from the short-term edge rule.'],
  ['Figaro', false, 'Traditional name, exempt from the short-term edge rule.'],
  ['Mari A S S', true, 'Multiple initials spelling a strong term are blocked under the stricter policy.'],
  ['Dick', true, 'Blocked by explicit user decision for the school.'],
  ['Fick', true, 'Blocked by explicit user decision for the school.'],
  ['Randy', false, 'Common English given name.'],
  ['Willy', false, 'Common given name despite an English slang meaning.'],
  ['Fanny', false, 'Common given name despite an English slang meaning.'],
  ['Cazzaniga', false, 'Italian surname, distinct from the blocked term.'],
  ['Culotta', false, 'Italian surname, exempt from the short-term edge rule.'],
  ['Pussycat', false, 'Ordinary English word for a cat, exempt from the edge rule.'],
  ['Shitake', false, 'Common mushroom spelling, exempt from the edge rule.'],
  ['Penistone', false, 'English place name.'],
  ['fica', false, 'Common Portuguese verb form takes priority over Italian slang.'],
  ['pica', false, 'Ordinary Portuguese verb form and bird name take priority over slang.'],
  ['cola', false, 'Ordinary word in Portuguese and Italian.'],
  ['bite', false, 'Ordinary English verb and noun.'],
  ['Gift', false, 'Ordinary English present and German poison.'],
  ['Mist', false, 'Ordinary English weather word and German manure.'],
  ['rat', false, 'Ordinary English animal word.'],
  ['fart', false, 'Mild bodily-function word omitted from this strong-language filter.'],
  ['slut', true, 'Offensive in English; Swedish is outside the four school languages.'],
  ['finocchio', true, 'Blocked by explicit user decision for the school.'],
  ['burro', false, 'Ordinary Italian butter and Portuguese animal word.'],
  ['bimbo', false, 'Ordinary Italian word for a child.'],
  ['sega', false, 'Ordinary Italian tool word.'],
  ['balle', false, 'Ordinary Italian noun with non-offensive meanings.'],
  ['palle', false, 'Ordinary Italian word for balls used in games.'],
  ['negro', true, 'Blocked by explicit user decision for the school.'],
  ['preto', false, 'Ordinary Portuguese color word.'],
  ['gay', false, 'Neutral identity term.'],
  ['schwul', false, 'Neutral German identity term.'],
  ['behindert', true, 'Blocked by explicit user decision for the school.'],
  ['deficiente', true, 'Blocked by explicit user decision for the school.'],
  ['handicappato', true, 'Blocked by explicit user decision for the school.'],
  ['Lucasfdp', true, 'A glued short strong term is blocked.'],
  ['Lucascu', true, 'A glued suffix is blocked.'],
  ['cuLucas', true, 'A glued prefix is blocked.'],
  ['f d p', true, 'Spaced strong abbreviations are blocked.'],
  ['c u', true, 'Two spaced letters forming a strong term are blocked.'],
  ['Ana L', false, 'A single initial is accepted.'],
  ['Ana 1', false, 'A standalone number is accepted.'],
  ['A 55', false, 'An initial followed by a number is accepted.'],
  ['Ro La', true, 'Adjacent short fragments join into a blocked Portuguese term.'],
] as const;

it.each(LANGUAGE_JUDGMENTS)('judgment for %s: %s (%s)', (word, blocked) => {
  expect(containsProfanity(word)).toBe(blocked);
});

const FRAGMENT_ACCEPTED = ['Ana L', 'Ana L.', 'Anna L', 'Anna L.', 'A 55', 'Ro L', 'Ana Lu', 'Ana Lu Maria', 'Maria Luiza', 'João Pedro', 'Pi Ca', 'Hans Peter', 'Anna Maria', 'Luca Matteo', 'Mary Jane', 'Ana L Maria'];
const FRAGMENT_BLOCKED = ['RO L A', 'Ro L A', 'Ana L A', 'Mari A S S', 'f d p', 'A B', 'Ana L. A.', 'Ro La', 'Ro la', 'RO LA', 'Pau Lo', 'Cu Lo', 'Fu Ck', 'Sh It', 'Cazz O', 'Ar Sch', 'Fi Ck', 'Di Ck', 'Lucas Fu Ck'];

describe('initials and adjacent fragments', () => {
  it.each(FRAGMENT_ACCEPTED)('accepts %s', (name) => {
    expect(containsProfanity(name)).toBe(false);
  });
  it.each(FRAGMENT_BLOCKED)('blocks %s', (name) => {
    expect(containsProfanity(name)).toBe(true);
  });
  it('preserves Ana/Anna with the single initial L as explicit common-name exceptions', () => {
    expect(containsProfanity('Ana L')).toBe(false);
    expect(containsProfanity('Anna L.')).toBe(false);
  });
  it('allows Pi Ca because its joined word is an ordinary cross-language word', () => {
    expect(containsProfanity('Pi Ca')).toBe(false);
  });
});

const REVIEW_ACCEPTED = ['Paulinho', 'Paulão', 'Paulina', 'Pauline', 'Paulus', 'Pauli', 'Paulista', 'Paul', 'Paul2', 'Cuca', 'Cunha', 'Cunhado', 'Cury', 'Cuiabá', 'Cutia', 'Cusco', 'Assunção', 'Gass', 'Tass', 'Lass', 'Hass', 'Paulsen', 'Paulson', 'Dickinson', 'Sexton', 'Cumberbatch', 'Hitchcock', 'Woodcock', 'Cocker', 'Pauta', 'Pausa', 'Pause', 'Cuidar', 'Curso', 'Cura', 'Curva', 'Cuspe', 'Cuscuz', 'Cubra', 'Cumprir', 'Cumprimento', 'Assado', 'Assustado', 'Assinatura', 'Assombração', 'Glass', 'Pass', 'Brass', 'Assembly', 'Assess', 'Cucumber', 'Cumin', 'Cumulus', 'Scum', 'Hell', 'Cuckoo', 'Culla', 'Culinaria', 'Ficus', 'Fickle', 'Cazzola', 'Dickey', 'Jazz'];
const REVIEW_BLOCKED = ['Lucasfdp', 'Lucascu', 'cuLucas', 'Lucasass', 'Lucas2cum', 'Hansscheisse', 'p. u. t. a', 'p  u  t  a', 'f1d1p', 'c2u', 's1h1i1t', 'f*ck', 'fvck', 'phuck', 'fuk', 'fuq', 'sh!t', 'f@ck', 'azz', 'cvnt', 'motherfuker', 'biatch', 'f!ck', 'h3ure', 'vaffa', 'pvttana', 'Lucasfodase', 'fodaseLucas'];
it.each(REVIEW_ACCEPTED)('preserves reviewed ordinary name or word %s', (name) => {
  expect(containsProfanity(name)).toBe(false);
});
it.each(REVIEW_BLOCKED)('blocks reviewed evasion %s', (name) => {
  expect(containsProfanity(name)).toBe(true);
});

const ANTIGRAVITY_ACCEPTED = ['Cálculo', 'Círculo', 'Século', 'Músculo', 'Veículo', 'Fígado', 'Iguaçu', 'Curioso', 'Assets', 'Assist', 'Cockpit', 'Cockroach', 'Cupcake', 'Curious', 'Brochure', 'Unisex', 'Pause', 'Spaß', 'Spass', 'Nass', 'Blass', 'Fass', 'Marsch', 'Barsch', 'Assel', 'Cuxhaven', 'Dicker', 'Paura', 'Pausa', 'Cucina', 'Cuore', 'Cugino', 'Cuoco', 'Assisi', 'Assai', 'Assoluto', 'Sfiga', 'Cue', 'Cueca', 'Cuela'];
const ANTIGRAVITY_BLOCKED = ['fags', 'niggers', 'sluts', 'whores', 'retards', 'arse', 'arsehole', 'shag', 'bellend', 'tosser', 'chink', 'spic', 'tranny', 'kys', 'omfg', 'lmfao', 'verfickt', 'gefickt', 'drecksau', 'miststück', 'miststueck', 'krüppel', 'krueppel', 'huso', 'hdf', 'oasch', 'wappler', 'trottl', 'beidl', 'fotzn', 'tschusch', 'huere', 'gopferdammi', 'fudi', 'vaffa', 'vaffan', 'suca', 'porca madona', 'diocane', 'dioporco', 'mona', 'fregna', 'scopare', 'inculare', 'checca', 'bucaiolo', 'ciula', 'belin', 'cagare', 'p/u/t/a', 'f/u/c/k', 'c,a,z,z,o', "f'u'c'k", '8itch', 'fa66ot', 'fi6a', 'ca22o', 'f|ck', 'cαzzo', 'fμck', 'shıτ', 'scheiβe', 'bloe1dmann', 'saubloe1d', 'Dick', 'Fick', 'finocchio', 'deficiente', 'handicappato', 'behindert', 'negro',
    'p!u!t!a', 'c|u', 'Lucasidiota', 'idiotaLucas', 'Lucasniggers'];
it.each(ANTIGRAVITY_ACCEPTED)('accepts multilingual review word %s', (name) => {
  expect(containsProfanity(name)).toBe(false);
});
it.each(ANTIGRAVITY_BLOCKED)('blocks multilingual review evasion %s', (name) => {
  expect(containsProfanity(name)).toBe(true);
});

const REVIEW_JUDGMENTS = [
  ['Hell', false, 'German adjective and real name take priority over the mild English exclamation.'],
  ['Cazzola', false, 'Exact Italian surname exception.'],
  ['Dickey', false, 'Exact English surname exception.'],
  ['Jazz', false, 'Ordinary musical word; the alternative vulgar spelling requires two final letters.'],
  ['Paul2', false, 'A known innocent name with a numeric suffix stays innocent.'],
  ['Lucasidiota', true, 'Unambiguous insult is blocked when glued to a name.'],
] as const;
it.each(REVIEW_JUDGMENTS)('review judgment for %s: %s (%s)', (word, blocked) => {
  expect(containsProfanity(word)).toBe(blocked);
});

const FINAL_SWEEP_ACCEPTED = ['Carvalho', 'Carvalhal', 'Porvir', 'Porva', 'Carvalhaes', 'Carvalhosa', 'Paulino', 'Pauletti', 'Paulucci', 'Paulon', 'Pauleto', 'Cury', 'Curi', 'Curti', 'Curvelo', 'Cutrim', 'Cunico', 'Cusinato', 'Cussi', 'Cuoghi', 'Cuccioli', 'Cucolo', 'Cuzzi', 'Cuzzolin', 'Cazzolato', 'Cunhambebe', 'Cuiabano', 'Assunta', 'Rolla', 'Dicksson', 'Fickinger', 'Pauls', 'Jass', 'Cuti', 'Cuzco', 'Culver', 'Curto', 'Custo', 'Curral', 'Cuspir', 'Cursar', 'Cubículo', 'Assim', 'Assistir', 'Assaltar', 'Assassino', 'Pausar', 'Cumpri', 'Sextou', 'Ana1'];
const FINAL_SWEEP_BLOCKED = ['Lucascu', 'vai-cu', 'Lucasass', 'Lucas2cum', 'Lucaspau', 'cuLucas', 'Lucasfdp', 'Hansscheisse', 'p1u1t1a', 'f1d1p', 'c2u', 'sl8t', 'fvck', 'pvta', 'pvttana', 'Paulinhofdp', 'Paulinhoass', 'Cunhambebefdp'];
it.each(FINAL_SWEEP_ACCEPTED)('accepts final sweep name or word %s', (name) => {
  expect(containsProfanity(name)).toBe(false);
});
it.each(FINAL_SWEEP_BLOCKED)('blocks final sweep glued form or disguise %s', (name) => {
  expect(containsProfanity(name)).toBe(true);
});
