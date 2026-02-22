(() => {
  const siteConfig = {
    MAX_PASSENGERS: 19,
    API_ENDPOINTS: {
      booking: "/api/submissions/booking",
      contact: "/api/submissions/contact"
    },
    THEME_COLORS: {
      primary: "#E0218A",
      secondary: "#0B1C2D",
      accent: "#C8A85C"
    },
    MOTION_LEVEL: "high-usable",
    CAPTCHA_MIN: 2,
    CAPTCHA_MAX: 12
  };

  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

  const navToggle = $("[data-nav-toggle]");
  const navMenu = $("[data-nav-menu]");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const open = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    $$("a", navMenu).forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const reveals = $$(".reveal, .reveal-stagger");
  if ("IntersectionObserver" in window && reveals.length) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );

    reveals.forEach((node) => observer.observe(node));
  } else {
    reveals.forEach((node) => node.classList.add("is-visible"));
  }

  const today = new Date();
  const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const clearErrors = (form) => {
    $$('[data-error-for]', form).forEach((el) => {
      el.textContent = "";
    });
    $$('.is-invalid', form).forEach((el) => {
      el.classList.remove("is-invalid");
    });
  };

  const setError = (form, name, msg) => {
    const errorEl = form.querySelector(`[data-error-for="${name}"]`);
    if (errorEl) {
      errorEl.textContent = msg;
    }
    const inputEl = form.querySelector(`[name="${name}"]`);
    if (inputEl) {
      inputEl.classList.add("is-invalid");
    }
  };

  const parseDate = (val) => {
    if (!val) return null;
    const d = new Date(`${val}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const airportOptions = [
    "LHR - London Heathrow (London, UK)",
    "LGW - London Gatwick (London, UK)",
    "STN - London Stansted (London, UK)",
    "LTN - London Luton (London, UK)",
    "LCY - London City (London, UK)",
    "SEN - London Southend (London, UK)",
    "BRS - Bristol Airport (Bristol, UK)",
    "BHX - Birmingham Airport (Birmingham, UK)",
    "MAN - Manchester Airport (Manchester, UK)",
    "LPL - Liverpool John Lennon Airport (Liverpool, UK)",
    "LBA - Leeds Bradford Airport (Leeds, UK)",
    "NCL - Newcastle International Airport (Newcastle, UK)",
    "EMA - East Midlands Airport (Nottingham/Derby, UK)",
    "CWL - Cardiff Airport (Cardiff, UK)",
    "SOU - Southampton Airport (Southampton, UK)",
    "BOH - Bournemouth Airport (Bournemouth, UK)",
    "EXT - Exeter Airport (Exeter, UK)",
    "NQY - Cornwall Airport Newquay (Newquay, UK)",
    "NWI - Norwich Airport (Norwich, UK)",
    "DSA - Doncaster Sheffield Airport (Doncaster, UK)",
    "MME - Teesside International Airport (Teesside, UK)",
    "HUY - Humberside Airport (Humberside, UK)",
    "ABZ - Aberdeen Airport (Aberdeen, UK)",
    "EDI - Edinburgh Airport (Edinburgh, UK)",
    "GLA - Glasgow Airport (Glasgow, UK)",
    "PIK - Glasgow Prestwick Airport (Glasgow, UK)",
    "INV - Inverness Airport (Inverness, UK)",
    "DND - Dundee Airport (Dundee, UK)",
    "BFS - Belfast International Airport (Belfast, UK)",
    "BHD - George Best Belfast City Airport (Belfast, UK)",
    "LDY - City of Derry Airport (Derry, UK)",
    "JER - Jersey Airport (Jersey, Channel Islands)",
    "GCI - Guernsey Airport (Guernsey, Channel Islands)",
    "IOM - Isle of Man Airport (Douglas, Isle of Man)",
    "DUB - Dublin Airport (Dublin, Ireland)",
    "SNN - Shannon Airport (Shannon, Ireland)",
    "ORK - Cork Airport (Cork, Ireland)",
    "AMS - Amsterdam Schiphol Airport (Amsterdam, Netherlands)",
    "CDG - Paris Charles de Gaulle Airport (Paris, France)",
    "ORY - Paris Orly Airport (Paris, France)",
    "NCE - Nice Cote d'Azur Airport (Nice, France)",
    "LYS - Lyon-Saint Exupery Airport (Lyon, France)",
    "MRS - Marseille Provence Airport (Marseille, France)",
    "FRA - Frankfurt Airport (Frankfurt, Germany)",
    "MUC - Munich Airport (Munich, Germany)",
    "BER - Berlin Brandenburg Airport (Berlin, Germany)",
    "DUS - Dusseldorf Airport (Dusseldorf, Germany)",
    "HAM - Hamburg Airport (Hamburg, Germany)",
    "STR - Stuttgart Airport (Stuttgart, Germany)",
    "ZRH - Zurich Airport (Zurich, Switzerland)",
    "GVA - Geneva Airport (Geneva, Switzerland)",
    "BSL - EuroAirport Basel Mulhouse Freiburg (Basel, Switzerland)",
    "VIE - Vienna International Airport (Vienna, Austria)",
    "BRU - Brussels Airport (Brussels, Belgium)",
    "LUX - Luxembourg Airport (Luxembourg)",
    "MAD - Adolfo Suarez Madrid-Barajas Airport (Madrid, Spain)",
    "BCN - Barcelona-El Prat Airport (Barcelona, Spain)",
    "PMI - Palma de Mallorca Airport (Palma, Spain)",
    "AGP - Malaga-Costa del Sol Airport (Malaga, Spain)",
    "LIS - Humberto Delgado Airport (Lisbon, Portugal)",
    "OPO - Francisco Sa Carneiro Airport (Porto, Portugal)",
    "MXP - Milan Malpensa Airport (Milan, Italy)",
    "LIN - Milan Linate Airport (Milan, Italy)",
    "FCO - Rome Fiumicino Airport (Rome, Italy)",
    "CIA - Rome Ciampino Airport (Rome, Italy)",
    "VCE - Venice Marco Polo Airport (Venice, Italy)",
    "BLQ - Bologna Guglielmo Marconi Airport (Bologna, Italy)",
    "FLR - Florence Airport (Florence, Italy)",
    "NAP - Naples International Airport (Naples, Italy)",
    "ATH - Athens International Airport (Athens, Greece)",
    "SKG - Thessaloniki Airport (Thessaloniki, Greece)",
    "PRG - Vaclav Havel Airport Prague (Prague, Czechia)",
    "BUD - Budapest Ferenc Liszt Airport (Budapest, Hungary)",
    "WAW - Warsaw Chopin Airport (Warsaw, Poland)",
    "KRK - Krakow John Paul II Airport (Krakow, Poland)",
    "CPH - Copenhagen Airport (Copenhagen, Denmark)",
    "ARN - Stockholm Arlanda Airport (Stockholm, Sweden)",
    "OSL - Oslo Airport Gardermoen (Oslo, Norway)",
    "HEL - Helsinki Airport (Helsinki, Finland)",
    "KEF - Keflavik International Airport (Reykjavik, Iceland)",
    "IST - Istanbul Airport (Istanbul, Turkiye)",
    "SAW - Sabiha Gokcen Airport (Istanbul, Turkiye)"
  ];

  const initAirportSearch = () => {
    const airportInputs = $$('input[name="from"], input[name="to"]');
    if (!airportInputs.length) return;

    let datalist = $("#airport-options-list");
    if (!datalist) {
      datalist = document.createElement("datalist");
      datalist.id = "airport-options-list";
      document.body.appendChild(datalist);
    }

    if (!datalist.children.length) {
      airportOptions.forEach((airport) => {
        const option = document.createElement("option");
        option.value = airport;
        datalist.appendChild(option);
      });
    }

    airportInputs.forEach((input) => {
      if (input.readOnly) {
        input.removeAttribute("list");
        input.setAttribute("autocomplete", "off");
        return;
      }
      input.setAttribute("list", "airport-options-list");
      input.setAttribute("autocomplete", "off");
      input.setAttribute("spellcheck", "false");
      if (!input.placeholder) input.placeholder = "Search airport";
    });
  };

  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const generateCaptcha = () => {
    const a = randInt(siteConfig.CAPTCHA_MIN, siteConfig.CAPTCHA_MAX);
    const b = randInt(siteConfig.CAPTCHA_MIN, siteConfig.CAPTCHA_MAX);
    if (Math.random() < 0.5) {
      return { prompt: `${a} + ${b}`, answer: a + b };
    }
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    return { prompt: `${hi} - ${lo}`, answer: hi - lo };
  };

  const fieldMaxLength = {
    from: 120,
    to: 120,
    contact_name: 100,
    contact_email: 150,
    contact_phone: 30,
    notes: 1000,
    captcha_answer: 8
  };

  const captchaState = new WeakMap();

  const cleanControlChars = (value) => String(value).replace(/[\u0000-\u001f\u007f]/g, "");
  const collapseSpaces = (value) => value.replace(/\s+/g, " ").trim();

  const sanitizeEmail = (value) => {
    const cleaned = cleanControlChars(value).replace(/\s+/g, "").toLowerCase();
    return cleaned.slice(0, fieldMaxLength.contact_email);
  };

  const sanitizePhone = (value) => {
    const cleaned = cleanControlChars(value)
      .replace(/[^\d+\-().\sx]/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.slice(0, fieldMaxLength.contact_phone);
  };

  const sanitizeText = (value, maxLen) => {
    const cleaned = collapseSpaces(cleanControlChars(value).replace(/[<>]/g, ""));
    return typeof maxLen === "number" ? cleaned.slice(0, maxLen) : cleaned;
  };

  const sanitizeTextarea = (value, maxLen) => {
    const cleaned = cleanControlChars(value).replace(/[<>]/g, "").trim();
    return typeof maxLen === "number" ? cleaned.slice(0, maxLen) : cleaned;
  };

  const sanitizeForm = (form) => {
    [...form.elements].forEach((el) => {
      if (!el || !el.name || el.disabled) return;
      const tag = el.tagName;
      const type = (el.type || "").toLowerCase();
      const name = el.name;
      const maxLen = fieldMaxLength[name];

      if (tag === "TEXTAREA") {
        el.value = sanitizeTextarea(el.value, maxLen);
        return;
      }

      if (tag === "SELECT") return;
      if (type === "date") return;

      if (type === "email") {
        el.value = sanitizeEmail(el.value);
      } else if (type === "tel") {
        el.value = sanitizePhone(el.value);
      } else if (type === "number") {
        const raw = String(el.value || "").trim();
        if (!raw) return;
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) {
          el.value = "";
          return;
        }
        const intVal = Math.round(parsed);
        if (name === "passengers") {
          el.value = String(Math.max(1, Math.min(siteConfig.MAX_PASSENGERS, intVal)));
        } else {
          el.value = String(intVal);
        }
      } else {
        el.value = sanitizeText(el.value, maxLen);
      }
    });
  };

  const sanitizeField = (el) => {
    if (!el || !el.name || el.disabled) return;
    const tag = el.tagName;
    const type = (el.type || "").toLowerCase();
    const name = el.name;
    const maxLen = fieldMaxLength[name];

    if (tag === "TEXTAREA") {
      el.value = sanitizeTextarea(el.value, maxLen);
      return;
    }
    if (tag === "SELECT" || type === "date") return;

    if (type === "email") {
      el.value = sanitizeEmail(el.value);
    } else if (type === "tel") {
      el.value = sanitizePhone(el.value);
    } else if (type === "number") {
      const raw = String(el.value || "").trim();
      if (!raw) return;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        el.value = "";
        return;
      }
      const intVal = Math.round(parsed);
      if (name === "passengers") {
        el.value = String(Math.max(1, Math.min(siteConfig.MAX_PASSENGERS, intVal)));
      } else {
        el.value = String(intVal);
      }
    } else {
      el.value = sanitizeText(el.value, maxLen);
    }
  };

  const refreshCaptcha = (form) => {
    const state = captchaState.get(form);
    if (!state) return;
    const challenge = generateCaptcha();
    form.dataset.captchaExpected = String(challenge.answer);
    state.question.textContent = `Solve: ${challenge.prompt}`;
    state.input.value = "";
    setError(form, "captcha_answer", "");
  };

  const insertCaptchaBlock = (form) => {
    if (captchaState.has(form)) return;

    const wrapper = document.createElement("div");
    wrapper.className = "field field-full form-captcha";

    const label = document.createElement("label");
    label.setAttribute("for", "captcha_answer");
    label.innerHTML = 'Captcha <span class="req-mark">*</span>';

    const row = document.createElement("div");
    row.className = "captcha-row";

    const question = document.createElement("p");
    question.className = "captcha-question";
    question.setAttribute("data-captcha-question", "");

    const refreshBtn = document.createElement("button");
    refreshBtn.type = "button";
    refreshBtn.className = "captcha-refresh";
    refreshBtn.textContent = "New challenge";

    const input = document.createElement("input");
    input.id = "captcha_answer";
    input.name = "captcha_answer";
    input.type = "text";
    input.required = true;
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.placeholder = "Type result";
    input.maxLength = fieldMaxLength.captcha_answer;

    const error = document.createElement("p");
    error.className = "error-note";
    error.dataset.errorFor = "captcha_answer";

    row.appendChild(question);
    row.appendChild(refreshBtn);
    wrapper.appendChild(label);
    wrapper.appendChild(row);
    wrapper.appendChild(input);
    wrapper.appendChild(error);

    const quoteActions = form.querySelector(".quote-actions");
    const responseEl = form.querySelector("[data-form-response]");
    const submitBtn = form.querySelector('button[type="submit"]');
    if (quoteActions) {
      form.insertBefore(wrapper, quoteActions);
    } else if (responseEl) {
      form.insertBefore(wrapper, responseEl);
    } else if (submitBtn) {
      form.insertBefore(wrapper, submitBtn);
    } else {
      form.appendChild(wrapper);
    }

    captchaState.set(form, { input, question, refreshBtn });
    refreshBtn.addEventListener("click", () => refreshCaptcha(form));
    refreshCaptcha(form);
  };

  const bindSanitizers = (form) => {
    [...form.elements].forEach((el) => {
      if (!el || !el.name || el.disabled) return;
      if (el.tagName === "BUTTON" || (el.type || "").toLowerCase() === "submit") return;
      el.addEventListener("blur", () => sanitizeField(el));
    });
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  const isValidPhone = (value) => {
    const digits = String(value).replace(/\D/g, "");
    return digits.length >= 6 && digits.length <= 15;
  };

  const validateForm = (form) => {
    sanitizeForm(form);
    clearErrors(form);
    let valid = true;

    const requiredFields = $$("[required]", form);
    requiredFields.forEach((input) => {
      if (input.disabled) return;
      const name = input.name;
      if (!name) return;
      if (!String(input.value).trim()) {
        setError(form, name, "This field is required.");
        valid = false;
      }
    });

    const departureRaw = form.elements.departure_date?.value || "";
    const returnRaw = form.elements.return_date?.value || "";
    const passengersRaw = form.elements.passengers?.value || "";

    const depDate = parseDate(departureRaw);
    const retDate = parseDate(returnRaw);
    const minDate = parseDate(isoToday);

    if (departureRaw && depDate && minDate && depDate < minDate) {
      setError(form, "departure_date", "Departure date cannot be in the past.");
      valid = false;
    }

    if (retDate && depDate && retDate < depDate) {
      setError(form, "return_date", "Return date cannot be before departure.");
      valid = false;
    }

    if (passengersRaw) {
      const passengers = Number(passengersRaw);
      if (!Number.isInteger(passengers) || passengers < 1 || passengers > siteConfig.MAX_PASSENGERS) {
        setError(form, "passengers", `Enter 1-${siteConfig.MAX_PASSENGERS} passengers.`);
        valid = false;
      }
    }

    const emailRaw = form.elements.contact_email?.value || "";
    const phoneRaw = form.elements.contact_phone?.value || "";

    if (emailRaw && !isValidEmail(emailRaw)) {
      setError(form, "contact_email", "Enter a valid email address.");
      valid = false;
    }

    if (phoneRaw && !isValidPhone(phoneRaw)) {
      setError(form, "contact_phone", "Enter a valid phone number.");
      valid = false;
    }

    const captchaInput = form.elements.captcha_answer;
    if (captchaInput) {
      const expected = Number(form.dataset.captchaExpected || "");
      const actual = Number(String(captchaInput.value || "").trim());
      if (!Number.isInteger(actual) || !Number.isInteger(expected) || actual !== expected) {
        setError(form, "captcha_answer", "Captcha answer is incorrect.");
        valid = false;
      }
    }

    return valid;
  };

  const buildPayload = (form) => {
    sanitizeForm(form);
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    if ("captcha_answer" in payload) delete payload.captcha_answer;
    payload.captcha_verified = true;
    payload.timestamp_iso = new Date().toISOString();
    payload.source_page = form.dataset.sourcePage || window.location.pathname;
    return payload;
  };

  const responseMessage = (form, state, text) => {
    const el = form.querySelector("[data-form-response]");
    if (!el) return;
    el.dataset.state = state;
    el.textContent = text;
  };

  const applyServerErrors = (form, errors = {}) => {
    Object.entries(errors).forEach(([field, message]) => {
      setError(form, field, message || "Invalid value.");
    });
  };

  const setDepartureMin = (form) => {
    const departure = form.elements.departure_date;
    const ret = form.elements.return_date;
    if (departure) {
      departure.min = isoToday;
      departure.addEventListener("change", () => {
        if (ret) {
          ret.min = departure.value || isoToday;
          if (ret.value && departure.value && ret.value < departure.value) {
            ret.value = departure.value;
          }
        }
      });
    }
    if (ret) {
      ret.min = isoToday;
    }
  };

  const submitForm = async (form) => {
    if (!validateForm(form)) {
      responseMessage(form, "error", "Please fix highlighted fields and try again.");
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton ? submitButton.textContent : "";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      const payload = buildPayload(form);
      const res = await fetch(siteConfig.API_ENDPOINTS.contact, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        if (result?.errors) {
          applyServerErrors(form, result.errors);
        }
        throw new Error("Contact submission failed");
      }
      responseMessage(form, "success", "");

      const contactConfirmation = form.parentElement?.querySelector("[data-contact-confirmation]");
      if (contactConfirmation) {
        form.hidden = true;
        contactConfirmation.hidden = false;
      } else {
        responseMessage(form, "success", "Your booking request has been sent securely. Our operations team will contact you.");
      }

    } catch (err) {
      console.error(err);
      if (typeof window.Turnstile !== "undefined") refreshTurnstile(form);
      refreshCaptcha(form);
      responseMessage(form, "error", "Submission failed. Please try again or call us.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  };

  const initBookingFlow = () => {
    const startForm = $('form[data-form-role="quote-start"]');
    if (startForm) {
      bindSanitizers(startForm);
      setDepartureMin(startForm);
      startForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!validateForm(startForm)) return;
        const params = new URLSearchParams({
          from: startForm.elements.from.value || "",
          to: startForm.elements.to.value || "",
          departure_date: startForm.elements.departure_date.value || "",
          source: "hero"
        });
        window.location.href = `booking.html?${params.toString()}`;
      });
    }

    const bookingStartForm = $('form[data-form-role="quote-booking-start"]');
    const bookingForm = $('form[data-form-role="quote-booking"]');
    const confirmationPanel = $('[data-quote-step="3"]');
    const backBtn = $("[data-step-back]");
    const restartBtn = $("[data-step-restart]");
    const summaryEl = $("[data-confirmation-summary]");
    const indicators = $$("[data-step-indicator]");
    if (!bookingStartForm || !bookingForm || !confirmationPanel) return;
    insertCaptchaBlock(bookingForm);
    bindSanitizers(bookingStartForm);
    bindSanitizers(bookingForm);

    const showStep = (n) => {
      bookingStartForm.classList.toggle("is-hidden", n !== 1);
      bookingForm.classList.toggle("is-hidden", n !== 2);
      confirmationPanel.classList.toggle("is-hidden", n !== 3);
      indicators.forEach((i) => i.classList.toggle("is-active", Number(i.dataset.stepIndicator) === n));
    };

    const copyStartToBooking = () => {
      bookingForm.elements.from.value = bookingStartForm.elements.from.value || "";
      bookingForm.elements.to.value = bookingStartForm.elements.to.value || "";
      bookingForm.elements.departure_date.value = bookingStartForm.elements.departure_date.value || "";
    };

    const copyBookingToStart = () => {
      bookingStartForm.elements.from.value = bookingForm.elements.from.value || "";
      bookingStartForm.elements.to.value = bookingForm.elements.to.value || "";
      bookingStartForm.elements.departure_date.value = bookingForm.elements.departure_date.value || "";
    };

    const query = new URLSearchParams(window.location.search);
    if (query.get("from")) {
      bookingStartForm.elements.from.value = query.get("from");
      bookingForm.elements.from.value = query.get("from");
    }
    if (query.get("to")) {
      bookingStartForm.elements.to.value = query.get("to");
      bookingForm.elements.to.value = query.get("to");
    }
    if (query.get("departure_date")) {
      bookingStartForm.elements.departure_date.value = query.get("departure_date");
      bookingForm.elements.departure_date.value = query.get("departure_date");
    }

    const buildTimeOptions = (selectName) => {
      const select = bookingForm.elements[selectName];
      if (!select || select.tagName !== "SELECT") return;
      for (let h = 0; h < 24; h += 1) {
        for (let m = 0; m < 60; m += 30) {
          const hh = String(h).padStart(2, "0");
          const mm = String(m).padStart(2, "0");
          const value = `${hh}:${mm}`;
          const opt = document.createElement("option");
          opt.value = value;
          opt.textContent = value;
          select.appendChild(opt);
        }
      }
    };
    buildTimeOptions("departure_time");
    buildTimeOptions("return_time");

    setDepartureMin(bookingStartForm);
    setDepartureMin(bookingForm);
    const shouldOpenStep2FromHero =
      query.get("source") === "hero" && (query.get("from") || query.get("to") || query.get("departure_date"));
    showStep(shouldOpenStep2FromHero ? 2 : 1);

    bookingStartForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateForm(bookingStartForm)) {
        responseMessage(bookingStartForm, "error", "Please fix highlighted fields and try again.");
        return;
      }
      copyStartToBooking();
      responseMessage(bookingStartForm, "", "");
      clearErrors(bookingStartForm);
      showStep(2);
    });

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        copyBookingToStart();
        clearErrors(bookingForm);
        showStep(1);
      });
    }

    const legacyBackLink = $('a[href="index.html#request-quote"]', bookingForm);
    if (legacyBackLink) {
      legacyBackLink.addEventListener("click", (event) => {
        event.preventDefault();
        copyBookingToStart();
        clearErrors(bookingForm);
        showStep(1);
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        bookingStartForm.reset();
        bookingForm.reset();
        refreshCaptcha(bookingForm);
        clearErrors(bookingStartForm);
        clearErrors(bookingForm);
        showStep(1);
      });
    }

    bookingForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateForm(bookingForm)) {
        responseMessage(bookingForm, "error", "Please fix highlighted fields and try again.");
        return;
      }
      clearErrors(bookingForm);
      responseMessage(bookingForm, "", "");

      const submitButton = bookingForm.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : "";
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }

      try {
        const payload = buildPayload(bookingForm);
        const res = await fetch(siteConfig.API_ENDPOINTS.booking, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok || !result.ok) {
          if (result?.errors) {
            applyServerErrors(bookingForm, result.errors);
          }
          throw new Error("Booking submission failed");
        }

        if (summaryEl) {
          const depTime = payload.departure_time === "anytime" ? "Anytime" : payload.departure_time;
          summaryEl.textContent = `Reference: ${result.id} | Route: ${payload.from} -> ${payload.to} | Departure: ${payload.departure_date} ${depTime}`;
        }
        showStep(3);
      } catch (err) {
        console.error(err);
        responseMessage(bookingForm, "error", "Submission failed. Please try again or call us directly.");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  };



  const initRoutesMap = () => {
    const mapEl = $("#routes-map");
    if (!mapEl || typeof window.L === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tabButtons = $$(".routes-city-tab");
    const tabsWrap = $(".routes-city-tabs");

    const cityGeo = {
      Elstree: { lat: 51.6519, lon: -0.3258 },
      London: { lat: 51.5074, lon: -0.1278, core: true },
      Edinburgh: { lat: 55.9533, lon: -3.1883 },
      Paris: { lat: 48.8566, lon: 2.3522 },
      Geneva: { lat: 46.2044, lon: 6.1432 },
      Frankfurt: { lat: 50.1109, lon: 8.6821 },
      Milan: { lat: 45.4642, lon: 9.19 },
      Vienna: { lat: 48.2082, lon: 16.3738 },
      Madrid: { lat: 40.4168, lon: -3.7038 },
      Barcelona: { lat: 41.3874, lon: 2.1686 },
      Rome: { lat: 41.9028, lon: 12.4964 },
      Athens: { lat: 37.9838, lon: 23.7275 },
      Cyprus: { lat: 35.1264, lon: 33.4299 },
      Istanbul: { lat: 41.0082, lon: 28.9784 }
    };

    const routes = [
      { from: "London", to: "Elstree" },
      { from: "London", to: "Edinburgh" },
      { from: "London", to: "Paris" },
      { from: "London", to: "Geneva" },
      { from: "London", to: "Frankfurt" },
      { from: "London", to: "Milan" },
      { from: "London", to: "Vienna" },
      { from: "London", to: "Madrid" },
      { from: "London", to: "Barcelona" },
      { from: "London", to: "Rome" },
      { from: "London", to: "Athens" },
      { from: "London", to: "Cyprus" },
      { from: "London", to: "Istanbul" }
    ];

    const map = L.map(mapEl, {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: !window.matchMedia("(max-width: 760px)").matches
    });

    const boundsPoints = [
      [cityGeo.Edinburgh.lat, cityGeo.Edinburgh.lon],
      [cityGeo.Cyprus.lat, cityGeo.Cyprus.lon]
    ];
    map.fitBounds(L.latLngBounds(boundsPoints).pad(0.05), { animate: false });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 8
    }).addTo(map);

    const cityMarkers = {};
    Object.entries(cityGeo).forEach(([name, geo]) => {
      const icon = L.divIcon({
        className: geo.core ? "routes-map-city hub" : "routes-map-city",
        iconSize: geo.core ? [14, 14] : [12, 12],
        iconAnchor: geo.core ? [7, 7] : [6, 6]
      });
      const marker = L.marker([geo.lat, geo.lon], { icon, keyboard: false }).addTo(map).bindTooltip(name, {
        direction: "top",
        offset: [0, -8],
        opacity: 0.95
      });
      cityMarkers[name] = marker;
    });

    const routeLayers = [];
    const planeMarkers = [];
    const planeIcon = L.divIcon({
      className: "routes-map-plane",
      html: "✈",
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    routes.forEach((route, idx) => {
      const from = cityGeo[route.from];
      const to = cityGeo[route.to];
      if (!from || !to) return;
      const points = [
        [from.lat, from.lon],
        [to.lat, to.lon]
      ];

      const baseLayer = L.polyline(points, {
        color: "#AAB1BD",
        weight: 2.2,
        opacity: 0.8,
        dashArray: "8 12"
      }).addTo(map);

      const progressLayer = L.polyline([points[0], points[0]], {
        color: "#E0218A",
        weight: 2.6,
        opacity: 0.95,
        dashArray: "8 12"
      }).addTo(map);

      routeLayers.push({ baseLayer, progressLayer, from: route.from, to: route.to });

      const plane = L.marker(points[0], { icon: planeIcon, interactive: false, keyboard: false }).addTo(map);
      planeMarkers.push({
        marker: plane,
        from: points[0],
        to: points[1],
        t: (idx * 0.13) % 1,
        speed: 0.0019 + (idx % 4) * 0.00024,
        progressLayer
      });
    });

    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    let raf = 0;
    const step = () => {
      planeMarkers.forEach((p) => {
        p.t += p.speed;
        if (p.t >= 1) p.t -= 1;
        const current = lerp(p.from, p.to, p.t);
        p.marker.setLatLng(current);
        p.progressLayer.setLatLngs([p.from, current]);
      });
      raf = requestAnimationFrame(step);
    };

    const setActiveCity = (city) => {
      tabButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.cityTab === city));
      Object.entries(cityMarkers).forEach(([name, marker]) => {
        const el = marker.getElement();
        if (!el) return;
        el.classList.toggle("is-active", name === city);
      });
      routeLayers.forEach((r) => {
        const active = city === "London" ? r.from === "London" : r.to === city || r.from === city;
        r.baseLayer.setStyle(active ? { weight: 2.8, opacity: 0.9 } : { weight: 2.2, opacity: 0.72 });
        r.progressLayer.setStyle(active ? { weight: 3.2, opacity: 1 } : { weight: 2.6, opacity: 0.9 });
      });
    };

    const cycleCities = [
      "London",
      "Edinburgh",
      "Paris",
      "Geneva",
      "Frankfurt",
      "Milan",
      "Vienna",
      "Madrid",
      "Barcelona",
      "Rome",
      "Athens",
      "Cyprus",
      "Istanbul"
    ];
    let activeIndex = 0;
    setActiveCity(cycleCities[activeIndex]);

    let cycleTimer = 0;
    const startCycle = () => {
      if (cycleTimer) return;
      cycleTimer = window.setInterval(() => {
        activeIndex = (activeIndex + 1) % cycleCities.length;
        setActiveCity(cycleCities[activeIndex]);
      }, 1000);
    };
    const stopCycle = () => {
      if (!cycleTimer) return;
      clearInterval(cycleTimer);
      cycleTimer = 0;
    };
    startCycle();

    tabButtons.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        stopCycle();
        setActiveCity(btn.dataset.cityTab || "");
      });
      btn.addEventListener("focus", () => {
        stopCycle();
        setActiveCity(btn.dataset.cityTab || "");
      });
    });

    if (tabsWrap) {
      tabsWrap.addEventListener("mouseleave", () => startCycle());
      tabsWrap.addEventListener("focusout", () => {
        const activeEl = document.activeElement;
        if (!tabsWrap.contains(activeEl)) startCycle();
      });
    }

    if (!prefersReducedMotion) {
      raf = requestAnimationFrame(step);
      window.addEventListener("beforeunload", () => cancelAnimationFrame(raf), { once: true });
    }
    window.addEventListener("beforeunload", () => stopCycle(), { once: true });
    setTimeout(() => map.invalidateSize(), 250);
    window.addEventListener("resize", () => map.invalidateSize());
  };

  document.addEventListener('DOMContentLoaded', () => {
    initAirportSearch();
    initBookingFlow();

    $$('form[data-form-role="contact"]').forEach((form) => {
      insertCaptchaBlock(form);
      bindSanitizers(form);
      setDepartureMin(form);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        submitForm(form);
      });
    });

    initRoutesMap();

    // Scroll Animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    // Header Scroll State
    const header = document.getElementById("header");
    if (header) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
          header.classList.add("scrolled");
        } else {
          header.classList.remove("scrolled");
        }
      });
      if (window.scrollY > 50) header.classList.add("scrolled");
    }

    // Mobile Nav Toggle
    const burger = document.getElementById('nav-burger');
    const mobileNav = document.getElementById('mobile-nav');

    const openMenu = () => {
      burger.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      mobileNav.classList.add('is-open');
      mobileNav.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('is-open');
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    if (burger && mobileNav) {
      burger.addEventListener('click', () => {
        burger.classList.contains('is-open') ? closeMenu() : openMenu();
      });

      // Close on nav link click
      mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
      });

      // Close on ESC key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
      });
    }

    const getThemeIcon = (theme) => {
      return theme === 'light'
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    };

    const setTheme = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('bfc-theme', theme);
      document.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
    };

    const toggleTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    };

    let desktopThemeBtn = null;
    let mobileThemeBtn = null;

    const updateThemeToggleUI = (theme) => {
      if (desktopThemeBtn) {
        desktopThemeBtn.innerHTML = getThemeIcon(theme);
        desktopThemeBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      }
      if (mobileThemeBtn) {
        mobileThemeBtn.innerHTML = `${getThemeIcon(theme)}<span>${theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>`;
        mobileThemeBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      }
    };

    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
      /* Contact Us Button */
      const contactLi = document.createElement('li');
      const contactBtn = document.createElement('a');
      contactBtn.href = "contact.html";
      contactBtn.className = 'btn btn-outline';
      contactBtn.style.padding = '0.5rem 1.2rem';
      contactBtn.style.marginLeft = '1rem';
      contactBtn.style.textDecoration = 'none';
      contactBtn.textContent = 'Contact Us';
      contactLi.appendChild(contactBtn);

      /* Theme Toggle Icon */
      const themeLi = document.createElement('li');
      const themeBtn = document.createElement('button');
      themeBtn.className = 'theme-toggle-icon';
      themeBtn.style.background = 'transparent';
      themeBtn.style.border = 'none';
      themeBtn.style.color = 'var(--color-primary)';
      themeBtn.style.cursor = 'pointer';
      themeBtn.style.marginLeft = '0.5rem';
      themeBtn.style.display = 'flex';
      themeBtn.style.alignItems = 'center';
      themeBtn.style.justifyContent = 'center';
      themeBtn.style.padding = '0.5rem';
      themeBtn.style.transition = 'opacity 0.2s';
      themeBtn.setAttribute('aria-label', 'Toggle theme');

      themeBtn.onmouseover = () => themeBtn.style.opacity = '0.7';
      themeBtn.onmouseout = () => themeBtn.style.opacity = '1';
      themeBtn.onclick = toggleTheme;
      desktopThemeBtn = themeBtn;

      themeLi.appendChild(themeBtn);

      navMenu.appendChild(contactLi);
      navMenu.appendChild(themeLi);
    }

    const mobileNavMenu = document.querySelector('.mobile-nav-menu');
    if (mobileNavMenu && !mobileNavMenu.querySelector('.mobile-nav-theme-toggle')) {
      const mobileThemeLi = document.createElement('li');
      mobileThemeLi.className = 'mobile-nav-theme-item';

      const mobileThemeToggle = document.createElement('button');
      mobileThemeToggle.type = 'button';
      mobileThemeToggle.className = 'mobile-nav-link mobile-nav-theme-toggle';
      mobileThemeToggle.onclick = () => {
        toggleTheme();
        if (mobileNav?.classList.contains('is-open')) closeMenu();
      };

      mobileThemeLi.appendChild(mobileThemeToggle);
      mobileNavMenu.appendChild(mobileThemeLi);
      mobileThemeBtn = mobileThemeToggle;
    }

    document.addEventListener('themeChanged', (e) => {
      updateThemeToggleUI(e.detail);
    });

    // Load saved theme or prompt user on index
    const savedTheme = localStorage.getItem('bfc-theme');
    const themeModal = document.getElementById('theme-modal');

    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      if (themeModal) {
        // Delay slightly for initial transition
        setTimeout(() => themeModal.classList.add('is-visible'), 400);

        const handleThemeChoice = (theme) => {
          setTheme(theme);
          themeModal.classList.remove('is-visible');
        };

        document.getElementById('theme-btn-dark').onclick = () => handleThemeChoice('dark');
        document.getElementById('theme-btn-light').onclick = () => handleThemeChoice('light');

        // As requested: closing modal without choice defaults to Light mode
        document.getElementById('theme-modal-close').onclick = () => handleThemeChoice('light');
      } else {
        // If navigating to another page directly without a saved preference, default to light mode
        setTheme('light');
      }
    }

    updateThemeToggleUI(document.documentElement.getAttribute('data-theme') || 'dark');
  });

  window.BFCConfig = siteConfig;
})();
