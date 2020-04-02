const fs = require('fs');

const rawEvents = fs.readFileSync('./failedEvents.json');
const events = JSON.parse(rawEvents);

const categories = events.reduce((acc, e) => {
  if (!(e.event in acc)) {
    acc[e.event] = [];
  }

  acc[e.event].push({
    timestamp: e.timestamp,
    customId: e.data.data.customId,
  });

  return acc;
}, {});

Object.keys(categories).forEach((c) => {
  console.info(`${c} event type count: `, categories[c].length);

  const ids = categories[c].reduce((acc, e) => {
    acc.push(e.customId);
    return acc;
  }, []);
  console.info('Ids', ids.join(', '));
});

// console.info(categories);
