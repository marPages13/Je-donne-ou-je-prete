// Génère les initiales pour l'avatar utilisateur à partir du username
function getUserInitials(username) {
  if (!username) return ''
  const parts = username.split('-')
  let initials = ''
  if (parts.length > 1) {
    initials = (parts[0][0] || '') + (parts[1][0] || '')
  } else {
    initials = username[0] || ''
  }
  return initials.toUpperCase()
}

window.addEventListener('DOMContentLoaded', function () {
  const userPhoto = document.querySelector('.user-photo')
  const username = document.querySelector('.sidebar h3')?.textContent?.trim()
  if (userPhoto && username) {
    const initials = getUserInitials(username)
    userPhoto.textContent = initials
    userPhoto.style.display = 'flex'
    userPhoto.style.alignItems = 'center'
    userPhoto.style.justifyContent = 'center'
    userPhoto.style.fontSize = '3rem'
    userPhoto.style.fontWeight = 'bold'
    userPhoto.style.color = '#fff'
    userPhoto.style.textTransform = 'uppercase'
    userPhoto.style.width = '120px'
    userPhoto.style.height = '120px'
    userPhoto.style.letterSpacing = '2px'
    userPhoto.style.userSelect = 'none'
  }
})
