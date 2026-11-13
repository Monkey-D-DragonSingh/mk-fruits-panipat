import { useState, type FormEvent, type ReactElement } from "react";
import { submitBooking } from "./lib/api";
import { FRUITS, type Fruit } from "./data";
import { saveLocalBooking } from "./lib/localBookings";
import AdminPanel from "./components/AdminPanel";
import GalleryPanel from "./components/GalleryPanel";

const PHONE_RE = /^\+?[0-9][0-9\s-]{9,}$/;
const TIME_SLOTS = ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM", "07:30 PM"];

const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#why", label: "Why Us" },
  { href: "#fruits", label: "Fruits" },
  { href: "#weddings", label: "Weddings" },
  { href: "#book", label: "Book Stall" },
];

const EMAIL = "mkfreshfruitpanipat@gmail.com";
const PHONE = "+91 8221900072";
const PHONE2 = "+91 8053645003";
const ADDRESS = "Fruit Farm Road, Near Old Bus Stand, Panipat, Haryana 132001";

/* ================= HEADER ================= */
function Header({
  navOpen,
  onToggleNav,
  onNavigate,
  onOpenGallery,
  onOpenOwner,
}: {
  navOpen: boolean;
  onToggleNav: () => void;
  onNavigate: () => void;
  onOpenGallery: () => void;
  onOpenOwner: () => void;
}) {
  return (
    <header className={`site-header${navOpen ? " is-open" : ""}`} id="siteHeader">
      <div className="container header-top">
        <a className="brand" href="#home" aria-label="MK Fruits Panipat — home">
          <svg className="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="20" r="19" fill="#FF6B35" />
            <path d="M20 6c6 2.5 9.5 7.6 9.5 13.5a9.5 9.5 0 0 1-19 0c0-5.9 3.5-11 9.5-13.5Z" fill="#10B981" />
            <path d="M20 9v13" stroke="#141416" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="brand-text">
            MK Fruits <span className="brand-accent">Panipat</span>
          </span>
        </a>
        <div className="header-actions">
          <a href="#book" className="btn btn-primary btn-book">Book Stall</a>
          <button className="btn btn-secondary btn-sm" type="button" onClick={onOpenGallery} aria-label="Photos and videos gallery">
            Gallery
          </button>
          <button className="btn btn-secondary btn-sm owner-trigger" type="button" onClick={onOpenOwner} aria-label="Owner Panel">
            Owner
          </button>
          <button
            className="nav-toggle"
            id="navToggle"
            type="button"
            aria-expanded={navOpen}
            aria-controls="siteNav"
            aria-label={navOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={onToggleNav}
          >
            {navOpen ? (
              <svg className="icon icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg className="icon icon-burger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        <nav className={`site-nav${navOpen ? " is-open" : ""}`} id="siteNav" aria-label="Primary">
          <div className="container nav-links" id="navLinks">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="nav-link" data-nav-link onClick={onNavigate}>
                {l.label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

/* ================= HERO ================= */
function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-blob" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">Wedding Fruit Stall · Panipat</p>
          <h1>
            Fresh Fruit Stalls <span className="accent">For Your Wedding</span>
          </h1>
          <p className="lede">
            Planning a wedding? Reach out to us and we’ll set up a beautiful fresh fruit stall at your venue. All the fruits listed below are included when you book our stall.
          </p>
          <div className="hero-cta">
            <a href="#fruits" className="btn btn-primary">
              See Included Fruits
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a href="#book" className="btn btn-secondary">Book Our Stall</a>
          </div>
          <ul className="hero-trust">
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Wedding-ready setup
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Fresh & handpicked
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              All listed fruits included
            </li>
          </ul>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <svg viewBox="0 0 320 320" fill="none">
            <circle cx="160" cy="160" r="150" fill="#1E1E24" />
            <path d="M160 30c55 18 85 62 85 112a85 85 0 0 1-170 0c0-50 30-95 85-112Z" fill="#059669" />
            <circle className="float-a" cx="128" cy="150" r="46" fill="#FF6B35" />
            <circle cx="128" cy="150" r="18" fill="#141416" />
            <circle className="float-b" cx="208" cy="112" r="34" fill="#10B981" />
            <circle className="float-c" cx="196" cy="196" r="24" fill="#4F46E5" />
            <circle className="float-d" cx="96" cy="210" r="18" fill="#A3E635" />
            <circle cx="96" cy="210" r="8" fill="#141416" />
            <circle cx="252" cy="196" r="14" fill="#EC4899" />
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ================= VALUE STRIP ================= */
function ValueStrip() {
  return (
    <section className="value-strip" id="why">
      <div className="container value-inner">
        <p className="value-proposition">
          Book us for your wedding. <span>We bring the fruit stall to you.</span>
        </p>
        <ul className="value-stats">
          <li>
            <strong>{FRUITS.length}+</strong>
            <span>Fruits Included</span>
          </li>
          <li>
            <strong>100%</strong>
            <span>Fresh & Handpicked</span>
          </li>
          <li>
            <strong>1</strong>
            <span>Beautiful Stall Setup</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

/* ================= BENEFITS ================= */
function Benefits() {
  const benefits: { icon: ReactElement; title: string; desc: string }[] = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20.94c.5-1 0-1.94 0-2.94 0-3-3-5.03-6-6 0 0 .5-1.44 0-2.94s.5-2.94 0-4C8 3 12 5 12 5c0 0 .5 1.56 0 3 0 1.06 0 2.94 0 2.94z" />
          <path d="M11 22c0 0 1 0 1 0z" />
        </svg>
      ),
      title: "Fresh & Handpicked",
      desc: "Premium fruits selected at peak ripeness so your guests enjoy the best quality.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22v-9M12 22s6-5.5 6-10a6 6 0 0 0-12 0c0 4.5 6 10 6 10Z" />
          <path d="M12 22v-9" />
        </svg>
      ),
      title: "Stall at Your Venue",
      desc: "We bring and set up a fresh fruit stall at your wedding venue — hassle-free for you.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
        </svg>
      ),
      title: "All Listed Fruits Included",
      desc: "When you book us, all the fruits shown in our list are included in your wedding stall.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      title: "Clean & Hygienic",
      desc: "Neat presentation and hygienic handling so your celebration stays perfect.",
    },
  ];

  return (
    <section className="section" id="benefits">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">Why MK Fruits</p>
          <h2>Perfect for Wedding Celebrations</h2>
          <p className="section-sub">A fresh fruit stall that adds colour, taste, and a premium touch to your wedding.</p>
        </header>
        <ul className="benefit-grid">
          {benefits.map((b) => (
            <li className="benefit-card" key={b.title}>
              <span className="benefit-icon">{b.icon}</span>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ================= FRUITS (INCLUDED) ================= */
function FruitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20M2 12h20" />
    </svg>
  );
}

function FruitCard({ fruit }: { fruit: Fruit }) {
  return (
    <article className="menu-card">
      <span className="menu-icon">
        <FruitIcon />
      </span>
      <h3>{fruit.english}</h3>
      <p>
        {fruit.hindi} · {fruit.origin}
      </p>
      <p>{fruit.desc}</p>
    </article>
  );
}

function FruitsIncluded() {
  return (
    <section className="section menu-section" id="fruits">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">Included Fruits</p>
          <h2>Fruits in Your Wedding Stall</h2>
          <p className="section-sub">
            Jab aap hamara fruit stall book karte ho, ye sab fresh fruits aapki wedding me stall par included milenge.
          </p>
        </header>
        <div className="menu-grid">
          {FRUITS.map((f) => (
            <FruitCard key={f.id} fruit={f} />
          ))}
        </div>
        <div className="menu-cta">
          <a href="#book" className="btn btn-primary btn-lg">Book Wedding Fruit Stall</a>
        </div>
      </div>
    </section>
  );
}

/* ================= WEDDINGS / CTA ================= */
function Weddings() {
  return (
    <section className="section catering" id="weddings">
      <div className="container catering-inner">
        <div className="catering-copy">
          <p className="eyebrow">For Weddings</p>
          <h2>Wedding aa rahi hai? Hum fruit stall laga denge.</h2>
          <p className="section-sub">
            Apni wedding date aur details share karo — hum aapke venue par fresh fruits ka stall setup karenge, jisme upar listed sab fruits included honge.
          </p>
        </div>
        <a href="#book" className="btn btn-primary btn-lg">Book Your Stall</a>
      </div>
    </section>
  );
}

/* ================= BOOKING ================= */
interface BookingFormState {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: string;
  notes: string;
}

function Booking() {
  const [bk, setBk] = useState<BookingFormState>({ name: "", phone: "", email: "", date: "", time: "", guests: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formHidden, setFormHidden] = useState(false);
  const [bkRef, setBkRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitNote, setSubmitNote] = useState("");

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (bk.name.trim().length < 2) next.bkName = "Please enter your full name.";
    if (!PHONE_RE.test(bk.phone.trim())) next.bkPhone = "Please enter a valid phone / WhatsApp number.";
    if (!bk.date) next.bkDate = "Please choose your wedding/event date.";
    if (!bk.time) next.bkTime = "Please select a time slot.";
    const guestNum = Number(bk.guests);
    if (!bk.guests || !Number.isFinite(guestNum) || guestNum < 1 || guestNum > 5000) next.bkGuests = "Please enter approximate number of guests.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitNote("");
    if (!validate()) return;
    setSubmitting(true);
    const payload = {
      name: bk.name.trim(),
      phone: bk.phone.trim(),
      email: bk.email.trim() || undefined,
      date: bk.date,
      time: bk.time,
      guests: Number(bk.guests),
      package: "Wedding Fruit Stall",
      notes: bk.notes.trim(),
      items: FRUITS.map((f) => ({ id: f.id, english: f.english, hindi: f.hindi, origin: f.origin })),
    };
    const res = await submitBooking(payload as any);
    setSubmitting(false);

    if (res.ok) {
      const data = res.data || {};
      const ref = data.ref || (data.id ? `MKFP-${String(data.id).slice(0, 8).toUpperCase()}` : `MKFP-${Date.now().toString(36).toUpperCase()}`);
      saveLocalBooking({
        id: data.id || ref,
        ref,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        date: payload.date,
        time: payload.time,
        guests: payload.guests,
        package: payload.package,
        notes: payload.notes,
        items: payload.items,
        status: data.status || "pending",
        createdAt: data.created_at || new Date().toISOString(),
        _local: data.storage === "local" || !data.created_at ? true : false,
      });
      setBkRef(ref);
      setSubmitNote("");
      setFormHidden(true);
      window.dispatchEvent(new Event("mkfp:bookings-updated"));
    } else {
      const localRef = `MKFP-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
      saveLocalBooking({
        id: localRef,
        ref: localRef,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        date: payload.date,
        time: payload.time,
        guests: payload.guests,
        package: payload.package,
        notes: payload.notes,
        items: payload.items,
        status: "pending",
        createdAt: new Date().toISOString(),
        _local: true,
      });
      setBkRef(localRef);
      setSubmitNote("Saved locally. Server/database response unavailable right now.");
      setFormHidden(true);
      window.dispatchEvent(new Event("mkfp:bookings-updated"));
    }
  }

  function onReset() {
    setBk({ name: "", phone: "", email: "", date: "", time: "", guests: "", notes: "" });
    setErrors({});
    setFormHidden(false);
    setSubmitNote("");
  }

  const infoAside = (
    <aside className="booking-info">
      <h3>Prefer to reach us directly?</h3>
      <ul className="info-list">
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p>
            <strong>Visit / Contact</strong>
            <br />
            {ADDRESS}
          </p>
        </li>
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 0.7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <p>
            <strong>Call / WhatsApp</strong>
            <br />
            {PHONE} / {PHONE2}
          </p>
        </li>
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <p>
            <strong>Email</strong>
            <br />
            {EMAIL}
          </p>
        </li>
      </ul>
    </aside>
  );

  if (formHidden) {
    return (
      <section className="section" id="book">
        <div className="container">
          <header className="section-head">
            <p className="eyebrow">Stall Booking</p>
            <h2>Book Wedding Fruit Stall</h2>
            <p className="section-sub">Share your wedding details and we’ll set up a fresh fruit stall at your venue with all listed fruits included.</p>
          </header>
          <div className="booking-grid">
            <div className="booking-form" style={{ textAlign: "center" }}>
              <div className="booking-success" id="bookingSuccess">
                <span className="success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <h3>Booking Request Received!</h3>
                <p>
                  Your wedding fruit stall request <strong id="bkRef">{bkRef}</strong> has been received. Our team will confirm via call / WhatsApp within 24 hours.
                </p>
                {submitNote ? <p className="form-note" style={{ color: "#FBBF24" }}>{submitNote}</p> : null}
                <button className="btn btn-secondary" type="button" onClick={onReset}>
                  Make Another Booking
                </button>
              </div>
            </div>
            {infoAside}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section" id="book">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">Stall Booking</p>
          <h2>Book Wedding Fruit Stall</h2>
          <p className="section-sub">Share your wedding details and we’ll set up a fresh fruit stall at your venue with all listed fruits included.</p>
        </header>
        <div className="booking-grid">
          <form className="booking-form" id="bookingForm" onSubmit={onSubmit} noValidate>
            <div className="field-row">
              <div className="field">
                <label htmlFor="bkName">Full Name <span aria-hidden="true"> *</span></label>
                <input className="input" type="text" id="bkName" value={bk.name} onChange={(e) => setBk({ ...bk, name: e.target.value })} placeholder="e.g. Priya Sharma" autoComplete="name" />
                <p className="field-error" data-for="bkName">{errors.bkName || ""}</p>
              </div>
              <div className="field">
                <label htmlFor="bkPhone">Phone / WhatsApp <span aria-hidden="true"> *</span></label>
                <input className="input" type="tel" id="bkPhone" value={bk.phone} onChange={(e) => setBk({ ...bk, phone: e.target.value })} placeholder="e.g. +91 98765 43210" autoComplete="tel" />
                <p className="field-error" data-for="bkPhone">{errors.bkPhone || ""}</p>
              </div>
            </div>
            <div className="field">
              <label htmlFor="bkEmail">Email <span className="optional">(optional)</span></label>
              <input className="input" type="email" id="bkEmail" value={bk.email} onChange={(e) => setBk({ ...bk, email: e.target.value })} placeholder="e.g. you@example.com" autoComplete="email" />
              <p className="field-error" data-for="bkEmail"></p>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="bkDate">Wedding / Event Date <span aria-hidden="true"> *</span></label>
                <input className="input" type="date" id="bkDate" value={bk.date} onChange={(e) => setBk({ ...bk, date: e.target.value })} />
                <p className="field-error" data-for="bkDate">{errors.bkDate || ""}</p>
              </div>
              <div className="field">
                <label htmlFor="bkTime">Preferred Time <span aria-hidden="true"> *</span></label>
                <select className="input" id="bkTime" value={bk.time} onChange={(e) => setBk({ ...bk, time: e.target.value })}>
                  <option value="" disabled>
                    Select time
                  </option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <p className="field-error" data-for="bkTime">{errors.bkTime || ""}</p>
              </div>
            </div>
            <div className="field">
              <label htmlFor="bkGuests">Approx. Guests <span aria-hidden="true"> *</span></label>
              <input className="input" type="number" id="bkGuests" min={1} max={5000} value={bk.guests} onChange={(e) => setBk({ ...bk, guests: e.target.value })} placeholder="e.g. 300" />
              <p className="field-error" data-for="bkGuests">{errors.bkGuests || ""}</p>
            </div>
            <div className="field">
              <label htmlFor="bkNotes">
                Venue / Notes <span className="optional">(optional)</span>
              </label>
              <textarea className="input" id="bkNotes" rows={3} value={bk.notes} onChange={(e) => setBk({ ...bk, notes: e.target.value })} placeholder="Venue address, wedding details, special requests..." />
            </div>
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Request Stall Booking"}
            </button>
            <p className="form-note">We confirm every booking via call or WhatsApp within 24 hours. All listed fruits are included in the wedding stall.</p>
          </form>
          {infoAside}
        </div>
      </div>
    </section>
  );
}

/* ================= FOOTER ================= */
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a className="brand brand-footer" href="#home">
            <svg className="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="19" fill="#FF6B35" />
              <path d="M20 6c6 2.5 9.5 7.6 9.5 13.5a9.5 9.5 0 0 1-19 0c0-5.9 3.5-11 9.5-13.5Z" fill="#10B981" />
              <path d="M20 9v13" stroke="#141416" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="brand-text">
              MK Fruits <span className="brand-accent">Panipat</span>
            </span>
          </a>
          <p>Wedding fruit stall service in Panipat — we set up fresh fruit stalls at your wedding with all our listed fruits included.</p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <h3>Explore</h3>
          <a href="#home">Home</a>
          <a href="#fruits">Included Fruits</a>
          <a href="#book">Book Stall</a>
        </nav>
        <div className="footer-contact">
          <h3>Contact</h3>
          <p>{ADDRESS}</p>
          <p>
            <a href={`tel:${PHONE.replace(/\s/g, "")}`}>{PHONE}</a>
          </p>
          <p>
            <a href={`tel:${PHONE2.replace(/\s/g, "")}`}>{PHONE2}</a>
          </p>
          <p>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>&copy; {year} MK Fruits Panipat. All rights reserved.</p>
      </div>
    </footer>
  );
}

/* ================= APP ================= */
export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <>
      <Header
        navOpen={navOpen}
        onToggleNav={() => setNavOpen((v) => !v)}
        onNavigate={() => setNavOpen(false)}
        onOpenGallery={() => {
          setNavOpen(false);
          setGalleryOpen(true);
        }}
        onOpenOwner={() => {
          setNavOpen(false);
          setOwnerOpen(true);
        }}
      />
      <main>
        <Hero />
        <ValueStrip />
        <Benefits />
        <FruitsIncluded />
        <Weddings />
        <Booking />
      </main>
      <Footer />
      <GalleryPanel open={galleryOpen} onClose={() => setGalleryOpen(false)} />
      <AdminPanel open={ownerOpen} onClose={() => setOwnerOpen(false)} />
    </>
  );
}
