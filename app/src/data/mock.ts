import { Order } from '../components/OrderCard';

/**
 * Frontend-only mock data mirroring the Figma feed cards.
 * Replace with real API calls when a backend is added.
 */
export const feedOrders: Order[] = [
  {
    id: '1',
    price: '23 900 сом',
    contract: 'contract',
    city: 'Бишкек',
    date: '12-18 апр',
    description:
      'Нужен артист, который поет в эстрадном стиле, уверенно держится на сцене, умеет создать атмосферу праздника и зажечь танцпол',
    authorName: 'Bea',
    authorRole: 'studio',
    authorRating: 4.8,
  },
  {
    id: '2',
    price: '12 000 сом',
    contract: 'contract',
    city: 'Ош',
    date: '12-мая',
    description:
      'Ищем харизматичного профи с мощным вокалом и живой энергетикой для ярких шоу. Если ты мастер импровизации и любишь публику — мы ждем тебя.',
    authorName: 'Карина',
    authorRole: 'customer',
    authorRating: 4.2,
    verified: true,
  },
  {
    id: '3',
    price: '56 000 сом',
    city: 'Кара-Балта',
    date: '12-мая',
    description:
      'Ищу профи с мощным вокалом и живой энергетикой для ярких шоу. Если ты мастер импровизации и любишь публику…',
    authorName: 'Bea',
    authorRole: 'artist',
  },
  {
    id: '4',
    price: '23 900 сом',
    city: 'Бишкек',
    date: '15 апр',
    description:
      'Ищу профи с мощным вокалом и живой энергетикой для ярких шоу. Если ты мастер импровизации…',
    authorName: 'Анна',
    authorRole: 'composer',
    authorRating: 5.0,
  },
];

export const myOrders: Order[] = [
  { ...feedOrders[0], id: 'm1' },
  { ...feedOrders[1], id: 'm2' },
];

export const responses: Order[] = [
  { ...feedOrders[1], id: 'r1', status: 'waiting' },
];

export const activeOrders: Order[] = [
  { ...feedOrders[0], id: 'a1', status: 'accepted' },
  { ...feedOrders[3], id: 'a2', status: 'accepted' },
];

export const notifications = [
  {
    section: 'Сегодня',
    items: [
      { id: 'n1', title: 'Bea Studio приняла ваш отклик', body: 'Перейдите в чат, чтобы начать совместный проект' },
      { id: 'n2', title: 'Карина готова к сотрудничеству', body: 'Ваша заявка привлекла…' },
    ],
  },
  {
    section: 'Вчера',
    items: [
      { id: 'n3', title: 'Подписка скоро закончится', body: 'Напоминаем о платеже 999 сом, до 12.02.2026' },
    ],
  },
  {
    section: '6 мая',
    items: [
      { id: 'n4', title: 'Технические работы', body: 'С 2:00 до 5:00 приложение будет временное недост…' },
    ],
  },
];
