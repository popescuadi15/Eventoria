import { Categorie } from '../types';

export const categorii: Categorie[] = [
  {
    id: '1',
    nume: 'Locație Eveniment',
    descriere: 'Spații premium pentru evenimente',
    imagine: 'https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg',
    pret_minim: 5000,
    pret_maxim: 50000,
    subcategorii: [
      { id: '1-1', nume: 'Săli de nuntă', descriere: 'Săli elegante pentru nunți' },
      { id: '1-2', nume: 'Conace și castele', descriere: 'Locații istorice cu farmec deosebit' },
      { id: '1-3', nume: 'Grădini și terase', descriere: 'Spații în aer liber pentru evenimente' }
    ]
  },
  {
    id: '2',
    nume: 'Fotografie și Video',
    descriere: 'Servicii profesionale de fotografie și videografie',
    imagine: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg',
    pret_minim: 2000,
    pret_maxim: 15000,
    subcategorii: [
      { id: '2-1', nume: 'Fotografie de eveniment', descriere: 'Fotografi specializați în evenimente' },
      { id: '2-2', nume: 'Videografie', descriere: 'Videografi profesioniști' },
      { id: '2-3', nume: 'Drone & Echipamente speciale', descriere: 'Filmări aeriene și echipamente avansate' }
    ]
  },
  {
    id: '3',
    nume: 'Muzică și Entertainment',
    descriere: 'Servicii de sonorizare și entertainment',
    imagine: 'https://images.pexels.com/photos/2034851/pexels-photo-2034851.jpeg',
    pret_minim: 1500,
    pret_maxim: 10000,
    subcategorii: [
      { id: '3-1', nume: 'DJ', descriere: 'DJ profesioniști pentru evenimente' },
      { id: '3-2', nume: 'Formații live', descriere: 'Formații muzicale pentru orice ocazie' },
      { id: '3-3', nume: 'Artiști & Animatori', descriere: 'Artiști și animatori pentru divertisment' }
    ]
  },
  {
    id: '4',
    nume: 'Catering',
    descriere: 'Servicii premium de catering',
    imagine: 'https://images.pexels.com/photos/5638732/pexels-photo-5638732.jpeg',
    pret_minim: 100,
    pret_maxim: 500,
    subcategorii: [
      { id: '4-1', nume: 'Catering full-service', descriere: 'Servicii complete de catering' },
      { id: '4-2', nume: 'Cofetărie & Patiserie', descriere: 'Deserturi și dulciuri pentru evenimente' },
      { id: '4-3', nume: 'Mixologie & Băuturi', descriere: 'Servicii de bar și cocktail-uri' }
    ]
  },
  {
    id: '5',
    nume: 'Decor și Aranjamente',
    descriere: 'Decorațiuni și aranjamente pentru evenimente',
    imagine: 'https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg',
    pret_minim: 1000,
    pret_maxim: 20000,
    subcategorii: [
      { id: '5-1', nume: 'Florărie', descriere: 'Aranjamente florale' },
      { id: '5-2', nume: 'Decor tematic', descriere: 'Decorațiuni tematice personalizate' },
      { id: '5-3', nume: 'Iluminat decorativ', descriere: 'Soluții de iluminat pentru evenimente' }
    ]
  },
  {
    id: '6',
    nume: 'Rochii și Costume',
    descriere: 'Ținute pentru orice tip de eveniment',
    imagine: 'https://images.pexels.com/photos/291759/pexels-photo-291759.jpeg',
    pret_minim: 1000,
    pret_maxim: 15000,
    subcategorii: [
      { id: '6-1', nume: 'Rochii de mireasă', descriere: 'Rochii de mireasă exclusiviste' },
      { id: '6-2', nume: 'Costume pentru miri', descriere: 'Costume elegante pentru miri' },
      { id: '6-3', nume: 'Accesorii', descriere: 'Accesorii pentru mirese și miri' }
    ]
  }
];