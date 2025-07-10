"use client";

import "./styles.css";

export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer-text">
        &copy; {new Date().getFullYear()} Fantasy Movie League. Created by
        Anthony Malatestinic.
      </p>
      <p className="footer-links">
        <a
          href="https://www.linkedin.com/in/anthony-malatestinic-2003b5154/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          LinkedIn
        </a>
        <a
          href="https://github.com/AMalatestinic"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          GitHub
        </a>
      </p>
    </footer>
  );
}
