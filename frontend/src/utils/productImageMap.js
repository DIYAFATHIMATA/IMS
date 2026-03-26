const REAL_IMAGES = {
  phone: [
    'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  laptop: [
    'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/7974/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  keyboard: [
    'https://images.pexels.com/photos/1772123/pexels-photo-1772123.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/38568/apple-imac-ipad-workplace-38568.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  mouse: [
    'https://images.pexels.com/photos/5082578/pexels-photo-5082578.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4526407/pexels-photo-4526407.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2098428/pexels-photo-2098428.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  monitor: [
    'https://images.pexels.com/photos/572056/pexels-photo-572056.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/704767/pexels-photo-704767.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4158/apple-iphone-smartphone-desk.jpg?auto=compress&cs=tinysrgb&w=800'
  ],
  cable: [
    'https://images.pexels.com/photos/4219862/pexels-photo-4219862.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/7605989/pexels-photo-7605989.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  paper: [
    'https://images.pexels.com/photos/590493/pexels-photo-590493.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/159740/notebook-paper-white-line-159740.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  furniture: [
    'https://images.pexels.com/photos/1957478/pexels-photo-1957478.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/37347/office-sitting-room-executive-sitting.jpg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/276583/pexels-photo-276583.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  headphones: [
    'https://images.pexels.com/photos/3394664/pexels-photo-3394664.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  watch: [
    'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  camera: [
    'https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/212372/pexels-photo-212372.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/994517/pexels-photo-994517.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  office: [
    'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/7974/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/37347/office-sitting-room-executive-sitting.jpg?auto=compress&cs=tinysrgb&w=800'
  ],
  warehouse: [
    'https://images.pexels.com/photos/6169668/pexels-photo-6169668.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/236705/pexels-photo-236705.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5025667/pexels-photo-5025667.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  default: [
    'https://images.pexels.com/photos/3962285/pexels-photo-3962285.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4481327/pexels-photo-4481327.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6169056/pexels-photo-6169056.jpeg?auto=compress&cs=tinysrgb&w=800'
  ]
};

function pickVariant(images, seed) {
  const safe = Array.isArray(images) && images.length ? images : REAL_IMAGES.default;
  const key = String(seed || 'product');
  const hash = key.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return safe[hash % safe.length];
}

const rules = [
  { test: /mouse|trackpad/i, image: REAL_IMAGES.mouse },
  { test: /keyboard/i, image: REAL_IMAGES.keyboard },
  { test: /monitor|display/i, image: REAL_IMAGES.monitor },
  { test: /cable|hdmi|usb|type-?c|hub|adapter|multiport/i, image: REAL_IMAGES.cable },
  { test: /paper|ream|notebook|sheet|stationery|organizer|file|folder/i, image: REAL_IMAGES.paper },
  { test: /chair|desk|table|furniture/i, image: REAL_IMAGES.furniture },
  { test: /phone|mobile|iphone|android/i, image: REAL_IMAGES.phone },
  { test: /laptop|macbook|notebook|computer/i, image: REAL_IMAGES.laptop },
  { test: /headphone|earbud|earphone|audio|speaker/i, image: REAL_IMAGES.headphones },
  { test: /watch|smart.?watch|clock/i, image: REAL_IMAGES.watch },
  { test: /camera|lens|dslr/i, image: REAL_IMAGES.camera },
  { test: /warehouse|inventory|stock|storage|box|carton/i, image: REAL_IMAGES.warehouse },
  { test: /stationery|furniture|printer|chair|table|pen|office|general/i, image: REAL_IMAGES.office }
];

export function getSeededProductImage(name = '', category = '') {
  const haystack = `${name} ${category}`.trim();
  const matched = rules.find((rule) => rule.test.test(haystack));
  if (matched) {
    return pickVariant(matched.image, haystack);
  }
  return pickVariant(REAL_IMAGES.default, haystack);
}
