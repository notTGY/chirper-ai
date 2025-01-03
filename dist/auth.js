//import './auth.css'

const checkHandle = async (handle) => {
  if (handle) return true
  return false
}

const checkLoginString = async (loginString) => {
  if (loginString !== ':') return true
  return false
}

export const authLayout = (codewords, onload) => {
  const authLayout = document.createElement('div')
  authLayout.className = 'auth-layout'


  const notification = document.createElement('div')
  notification.className = 'notification'
  notification.style.display = 'none'

  const loginForm = document.createElement('form')
  const loginInfo = document.createElement('span')
  loginInfo.innerText = 'Log in'
  loginInfo.className = 'auth-info'

  const loginInput = document.createElement('input')
  loginInput.name = 'login'
  loginInput.placeholder = 'handle'
  loginInput.className = 'login-input'
  const passwordInput = document.createElement('input')
  passwordInput.className = 'login-input'
  passwordInput.placeholder = 'code phrase'
  passwordInput.name = 'password'
  passwordInput.type = 'password'

  const loginButton = document.createElement('button')
  loginButton.className = 'handle-button'
  loginButton.innerText = 'Log in'

  
  loginForm.onsubmit = (e) => {
    e.preventDefault()
    const login = loginInput.value
    const password = passwordInput.value

    const loginString = `${login}:${password}`
    checkLoginString(loginString).then(async (res) => {
      if (res) {
        localStorage.setItem('auth', loginString)
        onload({ useCache: false })
      } else {
        // wrong login string
        const ip = await (await fetch('https://ipinfo.io/ip')).text()
        const locationData = await (await fetch(`https://api.iplocation.net/?ip=${ip}`)).json()
        loginForm.style.display = registrationForm.style.display = 'none'
        const { isp, country_name } = locationData

        notification.innerText = `You better get out of ${isp} ${country_name}! 😉`

        notification.style.display = 'block'
      }
    })
  }

  loginForm.append(
    loginInfo,
    loginInput,
    passwordInput,
    loginButton,
    'or register below',
  )


  const registrationForm = document.createElement('form')
  
  const info = document.createElement('span')
  info.innerText = 'Register: Pick your handle'
  info.className = 'auth-info'

  const handleInput = document.createElement('input')
  handleInput.name = 'login'
  handleInput.className = 'handle-input'
  handleInput.placeholder = 'chirp101'
  const handleInputInfo = document.createElement('span')
  handleInputInfo.style.display = 'none'
  const handleInputButton = document.createElement('button')
  handleInputButton.innerText = 'Select'
  handleInputButton.className = 'handle-button'
  handleInputButton.style.display = 'none'
  handleInput.oninput = (e) => {
    const val = e.target.value
    checkHandle(val).then((res) => {
      if (res) {
        handleInputInfo.innerText = 'Valid'
        handleInputInfo.className = 'input-info valid'
        handleInputInfo.style.display = 'inline'
        handleInputButton.style.display = 'block'
      } else {
        handleInputInfo.innerText = 'Invalid'
        handleInputInfo.className = 'input-info invalid'
        handleInputInfo.style.display = 'inline'
        handleInputButton.style.display = 'none'
      }
    })
  }

  const firstWordSelect = document.createElement('select')
  firstWordSelect.className = 'word-select'
  for (const option of [''].concat(codewords.first)) {
    const wordOption = document.createElement('option')
    wordOption.value = option
    wordOption.innerText = option
    firstWordSelect.append(wordOption)
  }

  const secondWordSelect = document.createElement('select')
  secondWordSelect.className = 'word-select'
  for (const option of [''].concat(codewords.second)) {
    const wordOption = document.createElement('option')
    wordOption.value = option
    wordOption.innerText = option
    secondWordSelect.append(wordOption)
  }

  const phraseInput = document.createElement('div')
  phraseInput.className = 'phrase-input'
  phraseInput.style.display = 'none'
  phraseInput.append(firstWordSelect, 'in the', secondWordSelect)

  const confirmInput = document.createElement('input')
  confirmInput.name = 'password'
  confirmInput.className = 'confirm-input'
  confirmInput.disabled = true

  confirmInput.onchange = confirmInput.oninput = (e) => {
    const first = firstWordSelect.value
    const second = secondWordSelect.value
    const password = `${first} in the ${second}`

    const confirmation = confirmInput.value
    if (confirmation === password) {
      handleInputButton.style.display = 'block'
    } else {
      handleInputButton.style.display = 'none'
    }
  }

  const confirmWrapper = document.createElement('div')
  confirmWrapper.className = 'confirm-wrapper'
  confirmWrapper.append('Confirm:', confirmInput)
  confirmWrapper.style.display = 'none'



  firstWordSelect.onchange =
  secondWordSelect.onchange = (e) => {
    const first = firstWordSelect.value
    const second = secondWordSelect.value
    
    if (first && second) {
      confirmInput.disabled = false
      confirmInput.placeholder = `${first} in the ${second}`
    } else {
      confirmInput.disabled = true
      confirmInput.placeholder = ''
    }

    const password = `${first} in the ${second}`
    const confirmation = confirmInput.value
    if (confirmation === password) {
      handleInputButton.style.display = 'block'
    } else {
      handleInputButton.style.display = 'none'
    }
  }

  registrationForm.onsubmit = (e) => {
    e.preventDefault()

    const handle = handleInput.value

    const first = firstWordSelect.value
    const second = secondWordSelect.value
    const password = `${first} in the ${second}`

    const confirmation = confirmInput.value

    const loginString = `${handle}:${password}`
    checkHandle(handle).then((res) => {
      if (res && confirmation !== password) {
        loginForm.style.display = 'none'

        info.innerText = 'Select code phrase'
        handleInput.style.display = 'none'
        handleInputInfo.style.display = 'none'
        handleInputButton.style.display = 'none'
        
        phraseInput.style.display = 'block'
        confirmWrapper.style.display = 'block'
      }
      if (res && confirmation === password) {
        localStorage.setItem('auth', loginString)
        onload({ useCache: false })
      }
    })
  }


  registrationForm.append(
    info,
    handleInput,
    handleInputInfo,
    phraseInput,
    confirmWrapper,
    handleInputButton,
  )
  authLayout.append(
    notification,
    loginForm,
    registrationForm,
  )
  return authLayout
}
