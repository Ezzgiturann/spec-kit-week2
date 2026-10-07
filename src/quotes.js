// Built-in quote collection. Ids are stored in visitors' saved favorites, so an id must never be
// reused for a different quote, even after the original quote is removed.

const freezeAll = (quotes) => Object.freeze(quotes.map((quote) => Object.freeze(quote)));

export const QUOTES = freezeAll([
  { id: 'q001', text: 'The unexamined life is not worth living.', author: 'Socrates' },
  {
    id: 'q002',
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Will Durant',
  },
  {
    id: 'q003',
    text: 'You have power over your mind — not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius',
  },
  {
    id: 'q004',
    text: 'It is not that we have a short time to live, but that we waste a lot of it.',
    author: 'Seneca',
  },
  {
    id: 'q005',
    text: 'The journey of a thousand miles begins with a single step.',
    author: 'Lao Tzu',
  },
  {
    id: 'q006',
    text: 'Imagination is more important than knowledge.',
    author: 'Albert Einstein',
  },
  {
    id: 'q007',
    text: 'In the middle of difficulty lies opportunity.',
    author: 'Albert Einstein',
  },
  {
    id: 'q008',
    text: 'The best time to plant a tree was twenty years ago. The second best time is now.',
    author: null,
  },
  {
    id: 'q009',
    text: 'Well done is better than well said.',
    author: 'Benjamin Franklin',
  },
  {
    id: 'q010',
    text: 'Simplicity is the ultimate sophistication.',
    author: 'Leonardo da Vinci',
  },
  {
    id: 'q011',
    text: 'Nothing in life is to be feared, it is only to be understood.',
    author: 'Marie Curie',
  },
  {
    id: 'q012',
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
  },
  {
    id: 'q013',
    text: 'Be the change that you wish to see in the world.',
    author: 'Mahatma Gandhi',
  },
  {
    id: 'q014',
    text: 'Whatever you are, be a good one.',
    author: 'Abraham Lincoln',
  },
  {
    id: 'q015',
    text: 'It always seems impossible until it is done.',
    author: 'Nelson Mandela',
  },
  {
    id: 'q016',
    text: 'Not all those who wander are lost.',
    author: 'J. R. R. Tolkien',
  },
  {
    id: 'q017',
    text: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
  },
  {
    id: 'q018',
    text: 'Knowing is not enough; we must apply. Willing is not enough; we must do.',
    author: 'Johann Wolfgang von Goethe',
  },
  {
    id: 'q019',
    text: 'Life can only be understood backwards; but it must be lived forwards.',
    author: 'Søren Kierkegaard',
  },
  {
    id: 'q020',
    text: 'Fall seven times, stand up eight.',
    author: null,
  },
  {
    id: 'q021',
    text: 'The more that you read, the more things you will know. The more that you learn, the more places you’ll go.',
    author: 'Dr. Seuss',
  },
  {
    id: 'q022',
    text: 'Do what you can, with what you have, where you are.',
    author: 'Theodore Roosevelt',
  },
  {
    id: 'q023',
    text: 'It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better. The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood; who strives valiantly.',
    author: 'Theodore Roosevelt',
  },
  {
    id: 'q024',
    text: 'Happiness depends upon ourselves.',
    author: 'Aristotle',
  },
]);
