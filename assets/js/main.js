const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbykGqSllTlx4Fy1ufxYEuC9kubWlxyaKtiGRp4DgzPnvmByYLR1EcCayEjXTEjBD-uo/exec';

(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let header = select('#header')
    let offset = header.offsetHeight

    if (!header.classList.contains('header-scrolled')) {
      offset -= 16
    }

    let elementPos = select(el).offsetTop
    window.scrollTo({
      top: elementPos - offset,
      behavior: 'smooth'
    })
  }

  /**
   * Header fixed top on scroll
   */
  let selectHeader = select('#header')
  if (selectHeader) {
    let headerOffset = selectHeader.offsetTop
    let nextElement = selectHeader.nextElementSibling
    const headerFixed = () => {
      if ((headerOffset - window.scrollY) <= 0) {
        selectHeader.classList.add('fixed-top')
        nextElement.classList.add('scrolled-offset')
      } else {
        selectHeader.classList.remove('fixed-top')
        nextElement.classList.remove('scrolled-offset')
      }
    }
    window.addEventListener('load', headerFixed)
    onscroll(document, headerFixed)
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function(e) {
    select('#navbar').classList.toggle('navbar-mobile')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
  })

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '.scrollto', function(e) {
    if (select(this.hash)) {
      e.preventDefault()

      let navbar = select('#navbar')
      if (navbar.classList.contains('navbar-mobile')) {
        navbar.classList.remove('navbar-mobile')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
      }
      scrollto(this.hash)
    }
  }, true)

  /**
   * Scroll with ofset on page load with hash links in the url
   */
  window.addEventListener('load', () => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash)
      }
    }
  });

  /**
   * Preloader
   */
  let preloader = select('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove()
    });
  }

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    })
  });

  const contactForm = select('.contact-form');
  if (contactForm) {
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const loadingMessage = contactForm.querySelector('.loading');
    const errorMessage = contactForm.querySelector('.error-message');
    const sentMessage = contactForm.querySelector('.sent-message');
    const honeypot = contactForm.elements.namedItem('botcheck');

    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const formData = new FormData(contactForm);
      const fieldNames = ['name', 'email', 'subject', 'message'];
      const hasBlankField = fieldNames.some((name) => !String(formData.get(name) || '').trim());
      const hasInvalidEmail = !contactForm.elements.namedItem('email').validity.valid;

      errorMessage.classList.remove('d-block');
      sentMessage.classList.remove('d-block');
      if (hasBlankField || hasInvalidEmail) {
        errorMessage.textContent = 'Please complete all fields with valid information.';
        errorMessage.classList.add('d-block');
        return;
      }

      if (honeypot.checked) {
        errorMessage.textContent = 'Unable to submit your message. Please try again.';
        errorMessage.classList.add('d-block');
        return;
      }

      fieldNames.forEach((name) => formData.set(name, String(formData.get(name)).trim()));
      const payload = Object.fromEntries(formData.entries());
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      loadingMessage.classList.add('d-block');

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'We could not send your message. Please try again.');
        }

        contactForm.reset();
        sentMessage.classList.add('d-block');
      } catch (error) {
        errorMessage.textContent = error.message || 'We could not send your message. Please try again.';
        errorMessage.classList.add('d-block');
      } finally {
        loadingMessage.classList.remove('d-block');
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
      }
    });
  }

  const evaluationForm = select('.evaluation-form');
  if (evaluationForm) {
    const submitButton = evaluationForm.querySelector('button[type="submit"]');
    const loadingMessage = evaluationForm.querySelector('.loading');
    const errorMessage = evaluationForm.querySelector('.error-message');
    const sentMessage = evaluationForm.querySelector('.sent-message');
    const countryCheckboxes = [...evaluationForm.querySelectorAll('input[name="preferred_countries"]')];
    const phoneInput = evaluationForm.elements.namedItem('phone');
    const englishStatus = evaluationForm.elements.namedItem('english_test_status');
    const englishScore = evaluationForm.elements.namedItem('english_test_score');
    const honeypot = evaluationForm.elements.namedItem('website');
    const updatePhoneValidity = () => {
      const phoneDigits = phoneInput.value.replace(/\D/g, '');
      const phoneIsValid = /^[0-9+() -]{8,20}$/.test(phoneInput.value.trim()) &&
        phoneDigits.length >= 8 && phoneDigits.length <= 15;
      phoneInput.setCustomValidity(
        phoneInput.value && !phoneIsValid ? 'Enter a valid phone number.' : ''
      );
    };
    const updateCountryValidity = () => {
      const hasCountry = countryCheckboxes.some((checkbox) => checkbox.checked);
      countryCheckboxes[0].setCustomValidity(hasCountry ? '' : 'Please choose at least one preferred country.');
    };
    const updateEnglishScoreValidity = () => {
      const required = englishStatus.value !== '' && englishStatus.value !== 'Not taken yet';
      englishScore.required = required;
      englishScore.setCustomValidity(
        required && !englishScore.value.trim() ? 'Please enter your English test score.' : ''
      );
    };

    updateCountryValidity();
    updateEnglishScoreValidity();
    phoneInput.addEventListener('input', updatePhoneValidity);
    countryCheckboxes.forEach((checkbox) => checkbox.addEventListener('change', updateCountryValidity));
    englishStatus.addEventListener('change', updateEnglishScoreValidity);
    englishScore.addEventListener('input', updateEnglishScoreValidity);

    evaluationForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      updateCountryValidity();
      updateEnglishScoreValidity();
      updatePhoneValidity();

      if (!evaluationForm.checkValidity()) {
        evaluationForm.reportValidity();
        return;
      }

      errorMessage.classList.remove('d-block');
      sentMessage.classList.remove('d-block');

      if (honeypot.value.trim()) {
        errorMessage.textContent = 'Unable to submit your evaluation. Please try again.';
        errorMessage.classList.add('d-block');
        return;
      }

      if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
        errorMessage.textContent = 'The evaluation form is not configured yet. Please contact us directly.';
        errorMessage.classList.add('d-block');
        return;
      }

      const formData = new FormData(evaluationForm);
      const payload = Object.fromEntries(formData.entries());
      payload.preferred_countries = formData.getAll('preferred_countries');
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      loadingMessage.classList.add('d-block');

      try {
        const response = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'We could not submit your evaluation. Please try again.');
        }

        evaluationForm.reset();
        updateCountryValidity();
        updateEnglishScoreValidity();
        sentMessage.classList.add('d-block');
      } catch (error) {
        errorMessage.textContent = error.message || 'We could not submit your evaluation. Please try again.';
        errorMessage.classList.add('d-block');
      } finally {
        loadingMessage.classList.remove('d-block');
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
      }
    });
  }

})()