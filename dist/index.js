// import './styles.css'
import { authLayout } from './auth.js'

let POSTS
let USERS_DATA
let LIKES
let AUTH_INFO
let CODEWORDS

const LIKE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentcolor" stroke="#777" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
  <path d="M4 16 C1 12 2 6 7 4 12 2 15 6 16 8 17 6 21 2 26 4 31 6 31 12 28 16 25 20 16 28 16 28 16 28 7 20 4 16 Z" />
</svg>
`
const PIC_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentcolor">
  <path d="M4 30 L28 30 C28 21 22 20 16 20 10 20 4 21 4 30 Z" />
  <path d="M22 11 C22 16 19 20 16 20 13 20 10 16 10 11 10 6 12 3 16 3 20 3 22 6 22 11 Z" />
</svg>
`
const SEND_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3">
  <path d="M2 16 L30 2 16 30 12 20 Z M30 2 L12 20" />
</svg>
`
const LINK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3">
  <path d="M18 8 C18 8 24 2 27 5 30 8 29 12 24 16 19 20 16 21 14 17 M14 24 C14 24 8 30 5 27 2 24 3 20 8 16 13 12 16 11 18 15" />
</svg>
`
const CODE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3">
  <path d="M10 9 L3 17 10 25 M22 9 L29 17 22 25 M18 7 L14 27" />
</svg>
`

function likePost(id) {
  if (LIKES.includes(id)) {
    LIKES = LIKES.filter(d => d != id)
  } else {
    LIKES = [...LIKES, id]
  }
  localStorage.setItem('likes', LIKES.join(','))
  onload({ useCache: true })
  // accessibility done right
  document.querySelector(`[data-id="${id}"]`).querySelector('button').focus()
}

// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function sfc32(a, b, c, d) {
  return function() {
    a |= 0; b |= 0; c |= 0; d |= 0; 
    var t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

const randomInt = (min, max, rand) =>
  Math.floor(rand() * (max - min + 1)) + min
// https://gist.github.com/bendc/76c48ce53299e6078a76
const randomColor = (id, lIncrement = 0) => {
  const seed = id ^ 0xDEADBEEF
  const rand = sfc32(
    0x9E3779B9, 0x243F6A88, 0xB7E15162, seed
  )
  for (let i = 0; i < id; i++) rand()
  const h = randomInt(0, 360, rand);
  const s = randomInt(42, 80, rand);
  const l = randomInt(40, 80, rand) + lIncrement;
  return `hsl(${h},${s}%,${l}%)`;
}

const Profile = ({id, name, bio, user_id}) => {
  const container = document.createElement('div')
  container.className = 'profile'
  const card = document.createElement('div')
  card.className = 'profile-card'
  const nav = document.createElement('div')
  nav.className = 'profile-nav'

  const Pic = document.createElement('div')
  Pic.innerHTML = PIC_SVG
  Pic.className = 'profile-pic'
  Pic.style.background = randomColor(user_id)
  Pic.style.color = randomColor(user_id, 10)

  const User = document.createElement('h2')
  User.innerText = name
  User.className = 'chirp-user'

  const Bio = document.createElement('div')
  Bio.className = 'profile-bio'
  Bio.innerText = bio

  const Back = document.createElement('div')
  Back.id = 'back'
  Back.innerHTML = document.getElementById('back').innerHTML


  card.append(Pic)
  card.append(User)
  card.append(Bio)

  nav.append(Back)

  container.append(card)
  container.append(nav)

  return container
}

const Chirp = ({
    id,
    user_id,
    text,
    date,
    author,
    lang,
}) => {
  const userId = USERS_DATA.find(u => u.user_id == user_id).id
  const container = document.createElement('div')
  container.className = 'chirp'
  container.setAttribute('data-id', id)

  const Pic = document.createElement('div')
  Pic.innerHTML = PIC_SVG
  Pic.className = 'chirp-pic'
  Pic.style.background = randomColor(user_id)
  Pic.style.color = randomColor(user_id, 10)

  const url = new URL(window.location.href || '')
  const params = new URLSearchParams(url.search)
  const User = document.createElement(
    params.has('user') ? 'h3' : 'a'
  )
  // XSS
  User.innerHTML = `${author}&nbsp;`
  if (!params.has('user')) {
    User.href = `/?user=${userId}`
  }
  User.className = 'chirp-user'

  const Text = document.createElement('p')
  Text.innerText = text
  Text.lang = lang
  Text.className = 'chirp-text translate'

  const Time = document.createElement('span')
  const time = new Date(date)
  if (isNaN(Date.parse(date))) {
    Time.innerText = date
  } else {
    Time.innerText = getRelativeTimeString(time)
    Time.title = time.toLocaleDateString()
  }
  Time.className = 'chirp-time'

  const Like = document.createElement('div')
  Like.className = 'chirp-like'
  if (LIKES.includes(id)) {
    Like.classList.add('checked')
  }

  const button = document.createElement('button')
  button.onclick = (e) => {
    e.stopPropagation()
    likePost(id)
  }
  button.innerHTML = LIKE_SVG
  button.title = 'Like'
  Like.append(button)

  container.append(Pic, User, Time, Text, Like)

  return container
}

const cleanChirp = ({
  id,
  user_id = 0,
  text = '',
  date = 'date unknown',
  lang = 'en',
}, usersData) => {
  const userData = usersData.find(p => p.user_id === user_id)
  const author = userData.name
  return {
    id,
    user_id,
    date,
    text,
    author,
    lang,
  }
}

const onload = async ({ useCache }) => {
  useCache = useCache || false

  LIKES =
    (localStorage.getItem('likes') || '')
      .split(',')
      .filter(s => s.length > 0)
      .map(Number)

  const url = new URL(window.location.href || '')
  const params = new URLSearchParams(url.search)
  
  AUTH_INFO = localStorage.getItem('auth') || ''
  if (AUTH_INFO === '') {
    if (!useCache) {
      let res = await fetch('/codewords.json')
      const codewordsData = await res.json()
      CODEWORDS = codewordsData
    }
    const root = document.getElementById('root')
    root.innerHTML = ''
    root.append(authLayout(CODEWORDS, onload))
  } else if (params.has('user')) {
    nav.style.display = 'none'
    const userId = params.get('user')

    if (!useCache) {
      let res = await fetch('/api/posts')
      const postsData = await res.json()
      res = await fetch('/api/users')
      const usersData = await res.json()
      USERS_DATA = usersData
      POSTS = postsData.map(d => cleanChirp(d, USERS_DATA))
    }

    const userData = USERS_DATA.find(u => u.id === userId)
    const user_id = userData.user_id
    const posts = POSTS.filter(p => p.user_id === user_id)


    const root = document.getElementById('root')
    root.innerHTML = ''
    const layout = document.createElement('div')
    layout.className = 'profile-layout'
    const postsLayout = document.createElement('div')
    postsLayout.className = 'posts-layout'
    if (posts.length === 0) {
      const center = document.createElement('center')
      const placeholder = document.createElement('div')
      placeholder.innerText = 'This user has no posts'
      center.append(placeholder)
      postsLayout.append(center)
    } else {
      postsLayout.append(...posts.map(Chirp))
    }
    if (userData) {
      layout.append(Profile(userData), postsLayout)
      root.append(layout)
    } else {
      const center = document.createElement('center')
      const placeholder = document.createElement('div')
      placeholder.innerText = 'User not found'
      const Back = document.createElement('a')
      Back.href = '/'
      Back.innerText = 'Go to feed'
      Back.style.margin = '1rem 0'

      center.append(placeholder, Back)
      root.append(center)
    }
  } else {
    if (!useCache) {
      let res = await fetch('/api/posts')
      const postsData = await res.json()
      res = await fetch('/api/users')
      const usersData = await res.json()
      USERS_DATA = usersData
      POSTS = postsData.map(d => cleanChirp(d, USERS_DATA))
    }

    const root = document.getElementById('root')
    root.innerHTML = ''
    root.append(...POSTS.map(Chirp))
  }
}

window.addEventListener('load', () => {
  onload({ useCache: false })
})

// https://gist.github.com/LewisJEllis/9ad1f35d102de8eee78f6bd081d486ad
function getRelativeTimeString(
  date,
  lang = "en"
) {
  const timeMs = typeof date === "number" ? date : date.getTime();
  const deltaSeconds = Math.round((timeMs - Date.now()) / 1000);
  const cutoffs = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity];
  const units = ["second", "minute", "hour", "day", "week", "month", "year"];
  const unitIndex = cutoffs.findIndex(cutoff => cutoff > Math.abs(deltaSeconds));
  const divisor = unitIndex ? cutoffs[unitIndex - 1] : 1;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  return rtf.format(Math.floor(deltaSeconds / divisor), units[unitIndex]);
}
