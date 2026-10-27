import { useState } from 'react';
import { CountryCodeSelect } from './CountryCodeSelect.jsx';
import { api } from '../services/api.js';
import { User, Mail, Building, Phone, Loader2, AlertCircle, Sparkles } from 'lucide-react';

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export function RegistrationForm({ onSuccess }) {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Computed full E.164 number
  const cleanNumber = phoneNumber.trim().replace(/[^0-9]/g, '');
  const computedE164 = cleanNumber ? `${countryCode}${cleanNumber}` : '';

  const validate = () => {
    const errs = {};

    if (!fullName.trim()) {
      errs.fullName = 'Full Name is required.';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!cleanNumber) {
      errs.phone = 'Phone number is required.';
    } else if (!E164_REGEX.test(computedE164)) {
      errs.phone = `Invalid E.164 format (${computedE164}). Must contain 8 to 15 digits.`;
    }

    if (!consent) {
      errs.consent = 'You must agree to the consent terms to register.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: computedE164,
        company: company.trim() || undefined,
        consent,
      });

      if (!response.success) {
        setServerError(response.error || 'Registration failed.');
      } else {
        onSuccess(response.data);
      }
    } catch (err) {
      setServerError(err.message || 'Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="form-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Sparkles size={16} /> AutoComm Instant Onboarding
        </div>
        <h1 className="form-title" style={{ marginTop: '6px' }}>User Registration Portal</h1>
        <p className="form-subtitle">
          Register your contact details to connect with AutoComm test channels and campaign groups.
        </p>
      </div>

      <form className="form-body" onSubmit={handleSubmit} noValidate>
        {serverError && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="fullName">
            <User size={15} color="#6366f1" /> Full Name <span className="req-star">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            className={`form-input ${errors.fullName ? 'input-error' : ''}`}
            placeholder="e.g. John Doe"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors({ ...errors, fullName: null });
            }}
            disabled={loading}
          />
          {errors.fullName && <div className="error-text"><AlertCircle size={13} /> {errors.fullName}</div>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            <Mail size={15} color="#6366f1" /> Email Address <span className="req-star">*</span>
          </label>
          <input
            id="email"
            type="email"
            className={`form-input ${errors.email ? 'input-error' : ''}`}
            placeholder="e.g. john.doe@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            disabled={loading}
          />
          {errors.email && <div className="error-text"><AlertCircle size={13} /> {errors.email}</div>}
        </div>

        {/* Phone with Country Code Selector */}
        <div className="form-group">
          <label className="form-label" htmlFor="phone">
            <Phone size={15} color="#6366f1" /> Phone Number (E.164) <span className="req-star">*</span>
          </label>
          <div className="phone-row">
            <CountryCodeSelect
              value={countryCode}
              onChange={(code) => setCountryCode(code)}
              disabled={loading}
            />
            <input
              id="phone"
              type="tel"
              className={`form-input ${errors.phone ? 'input-error' : ''}`}
              placeholder="e.g. 415 555 2671"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (errors.phone) setErrors({ ...errors, phone: null });
              }}
              disabled={loading}
            />
          </div>
          {computedE164 && (
            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              International E.164 Preview: <code style={{ fontWeight: 600, color: '#4f46e5' }}>{computedE164}</code>
            </div>
          )}
          {errors.phone && <div className="error-text"><AlertCircle size={13} /> {errors.phone}</div>}
        </div>

        {/* Company (Optional) */}
        <div className="form-group">
          <label className="form-label" htmlFor="company">
            <Building size={15} color="#64748b" /> Company Name <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 400 }}>(Optional)</span>
          </label>
          <input
            id="company"
            type="text"
            className="form-input"
            placeholder="e.g. Acme Corporation"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Consent Checkbox */}
        <div className="form-group">
          <div
            className="consent-container"
            style={{
              borderColor: errors.consent ? '#fca5a5' : undefined,
              background: errors.consent ? '#fff5f5' : undefined,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              if (e.target.tagName !== 'INPUT') {
                setConsent(!consent);
                if (errors.consent) setErrors({ ...errors, consent: null });
              }
            }}
          >
            <input
              type="checkbox"
              id="consent"
              name="consent"
              className="consent-checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (errors.consent) setErrors({ ...errors, consent: null });
              }}
              disabled={loading}
            />
            <label htmlFor="consent" className="consent-label" style={{ userSelect: 'none' }}>
              I agree to receive WhatsApp messages and automated calls from AutoComm on this number. <span className="req-star">*</span>
            </label>
          </div>
          {errors.consent && <div className="error-text"><AlertCircle size={13} /> {errors.consent}</div>}
        </div>

        {/* Submit Button */}
        <button type="submit" id="registerBtn" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={18} className="spinner" />
              <span>Processing with AutoComm...</span>
            </>
          ) : (
            <span>Register</span>
          )}
        </button>
      </form>
    </div>
  );
}
