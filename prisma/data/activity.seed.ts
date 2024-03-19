import { Prisma, PrismaActivitySource, PrismaUtskott } from '@prisma/client';

function getRandomDate(): Date {
  const today = new Date();
  const oneYearForward = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000); // Adding milliseconds for one year

  const randomTime = today.getTime() + Math.random() * (oneYearForward.getTime() - today.getTime());
  return new Date(randomTime);
}

export const activities: Prisma.PrismaActivityCreateInput[] = [
  {
    utskott: PrismaUtskott.CM,
    source: PrismaActivitySource.WEBSITE,
    title: 'Baktävling',
    description:
      '"Välkommen till vårt mysiga café där doften av nybakat bröd och kaffe möter dig i dörren. Varje dag bjuder vi på en smakupplevelse utöver det vanliga, och nu är det din chans att delta i vår spännande baktävling! Ge din kreativitet fria tyglar och skapa det perfekta bakverket som kommer att imponera på vår jury. Vem vet, kanske blir just din skapelse den nya favoriten på vårt café! Så plocka fram dina bästa recept och låt bakningen börja!"',
    startDate: getRandomDate(),
    imageUrl: 'https://esek.se/_app/immutable/assets/1-3fd67044.webp',
    locationTitle: '',
    locationLink: '',
  },
  {
    utskott: PrismaUtskott.FVU,
    source: PrismaActivitySource.WEBSITE,
    title: 'Fixar-kväll',
    description:
      'Känn pulsen i vår fixar-kväll, där passion och kreativitet förenas i en atmosfär av skapande. Tillsammans bygger vi, skapar och inspireras av varandras projekt. Låt idéerna flöda och låt dina händer forma det du drömmer om. Kom och var en del av vår gemenskap för en oförglömlig kväll!',
    startDate: getRandomDate(),
    imageUrl: 'https://esek.se/_app/immutable/assets/1-3fd67044.webp',
    locationTitle: '',
    locationLink: '',
  },
  {
    utskott: PrismaUtskott.INFU,
    source: PrismaActivitySource.WEBSITE,
    title: 'Hacker',
    description:
      'Välkommen till det ultimata hacker eventet där kreativitet och teknologi möts i en spännande atmosfär. Här samlas hackare från hela världen för att utforska nya gränser och lösa utmaningar. Ta del av inspirerande föreläsningar, knäck koder och skapa banbrytande innovationer tillsammans med oss!',
    startDate: getRandomDate(),
    imageUrl: 'https://esek.se/_app/immutable/assets/1-3fd67044.webp',
    locationTitle: '',
    locationLink: '',
  },
  {
    utskott: PrismaUtskott.KM,
    source: PrismaActivitySource.WEBSITE,
    title: 'Gille',
    description:
      '"Välkommen till vårt gemytliga gille där vänner samlas för goda drycker och skrattfyllda stunder. Njut av vårt utbud av förfriskningar och klassiska rätter i en avslappnad atmosfär. Låt kvällen ta fart med livlig musik och härlig stämning. Kom och upplev en kväll att minnas på vårt charmiga gille!"',
    startDate: getRandomDate(),
    imageUrl: 'https://esek.se/_app/immutable/assets/1-3fd67044.webp',
    locationTitle: '',
    locationLink: '',
  },
  {
    utskott: PrismaUtskott.NOLLU,
    source: PrismaActivitySource.WEBSITE,
    title: 'Regattan',
    description:
      'Känn spänningen på regattan, där havet blir slagfält och seglen sträcks mot vindens kraft. Deltagare från alla hörn av världen tävlar om ära och berömmelse i detta episka sjökrig. Stå öga mot öga med dina motståndare och visa din skicklighet på de vilda vågorna. Detta är inte bara en tävling, det är ett äventyr till havs!',
    startDate: getRandomDate(),
    imageUrl: 'https://esek.se/_app/immutable/assets/1-3fd67044.webp',
    locationTitle: '',
    locationLink: '',
  },
  {
    utskott: PrismaUtskott.ENU,
    source: PrismaActivitySource.WEBSITE,
    title: 'Lunchföreläsning',
    description:
      'Välkommen till vår inspirerande lunchföreläsning där vi välkomnar ett ledande företag för att dela med sig av sin kunskap och erfarenhet. Njut av en lärorik stund med spännande insikter och möjligheter till nätverkande. Ge dig själv en energiboost mitt på dagen och låt dig inspireras av framgångsrika företagare.',
    startDate: getRandomDate(),
    imageUrl: 'https://esek.se/_app/immutable/assets/1-3fd67044.webp',
    locationTitle: '',
    locationLink: '',
  },
  {
    utskott: PrismaUtskott.PENGU,
    source: PrismaActivitySource.WEBSITE,
    title: 'Bokföringskväll',
    description:
      'Det är dags att ta tag i bokföringen tillsammans! I vår grupp samlas vi för att effektivt hantera våra ekonomiska transaktioner och säkerställa noggrannheten i våra bokföringsposter. Med teamwork och noggrant arbete ser vi till att varje siffra landar rätt och att vår ekonomi är i balans.',
    startDate: getRandomDate(),
    imageUrl: 'https://esek.se/_app/immutable/assets/1-3fd67044.webp',
    locationTitle: '',
    locationLink: '',
  },
  {
    utskott: PrismaUtskott.E6,
    source: PrismaActivitySource.WEBSITE,
    title: 'Sittning',
    description:
      'Välkommen till en kväll fylld av gemenskap och glädje! Vi öppnar våra dörrar för en minnesvärd sittning där vi samlas för god mat, gott sällskap och underhållande samtal. Låt oss skapa minnen tillsammans och njuta av en kväll att komma ihåg. Välkommen till vårt bord!',
    startDate: getRandomDate(),
    imageUrl: 'https://esek.se/_app/immutable/assets/1-3fd67044.webp',
    locationTitle: '',
    locationLink: '',
  },
  {
    utskott: PrismaUtskott.SRE,
    source: PrismaActivitySource.WEBSITE,
    title: 'Pluggkväll',
    description:
      'Det är dags att sätta näsan i böckerna! Välkommen till vår pluggkväll där vi tillsammans fokuserar på att nå våra studiemål. Med lugn atmosfär och gemensamt stöd tar vi itu med utmaningarna och strävar efter framgång. Låt oss inspirera varandra till framsteg och lärande. Tillsammans når vi nya höjder!',
    startDate: getRandomDate(),
    imageUrl: 'https://esek.se/_app/immutable/assets/1-3fd67044.webp',
    locationTitle: '',
    locationLink: '',
  },
  {
    utskott: PrismaUtskott.STYRELSEN,
    source: PrismaActivitySource.WEBSITE,
    title: 'Styrelsemöte',
    description:
      'Välkommen till vårt styrelsemöte där vi samlas för att diskutera strategier och fatta beslut för sektionens framtid. Med fokus och engagemang går vi igenom dagordningen och arbetar tillsammans mot gemensamma mål. Låt oss samarbeta för att forma en framgångsrik väg framåt. Mötet är nu öppnat!',
    startDate: getRandomDate(),
    imageUrl: 'https://esek.se/_app/immutable/assets/1-3fd67044.webp',
    locationTitle: '',
    locationLink: '',
  },
  {
    utskott: PrismaUtskott.OTHER,
    source: PrismaActivitySource.WEBSITE,
    title: 'NolleGasque',
    description:
      'Välkomna till årets mest efterlängtade fest, NolleGasquen! En storslagen sittning där vi firar gemenskap, glädje och minnen för livet. Med uppdukade festligheter och en sprakande atmosfär skapar vi magiska ögonblick tillsammans. Låt oss fira studentlivet och välkomna de nya äventyren som väntar!',
    startDate: getRandomDate(),
    imageUrl: 'https://esek.se/_app/immutable/assets/1-3fd67044.webp',
    locationTitle: '',
    locationLink: '',
  },
];
