import classie from 'desandro-classie';

const menuButton = document.querySelector('#menu-button');
const menuNav = document.querySelector('#menu-nav');

menuButton.addEventListener('click', e => {
  e.preventDefault();

  if (classie.has(menuNav, 'menu-nav-open')) {
    classie.remove(menuNav, 'menu-nav-open');
  } else {
    classie.add(menuNav, 'menu-nav-open');
  }
});
