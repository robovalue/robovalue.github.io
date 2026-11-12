import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './benchmark';
import { prepareSubmissionAttempt } from './eval-request.mjs';
import { sendApplication } from './eval-transport.mjs';
import { submissionNotice, describeSubmissionNotice } from './eval-status.mjs';
import './eval.css';

// The anonymous review version displays the form without contacting a backend.
const SUBMISSION_MODE = 'review';

const BASIC_FIELDS = [
  { name: 'teamName', label: 'Team Name', maxLength: 120, placeholder: 'Team name', autoComplete: 'off' },
  { name: 'organization', label: 'Organization', maxLength: 160, placeholder: 'Organization', autoComplete: 'organization' },
  { name: 'modelName', label: 'Model Name', maxLength: 160, placeholder: 'Model name and version', autoComplete: 'off' },
  { name: 'email', label: 'Email', type: 'email', maxLength: 254, placeholder: 'Email address', autoComplete: 'email' },
];
const CONTACT_METHODS = {
  phone: { fieldLabel: 'Phone Number', type: 'tel', maxLength: 40, autoComplete: 'tel', placeholder: 'Phone' },
  wechat: { fieldLabel: 'WeChat ID', maxLength: 64, autoComplete: 'off', placeholder: 'WeChat ID' },
  discord: { fieldLabel: 'Discord Username', maxLength: 32, autoComplete: 'off', placeholder: 'Username' },
};

function validateApplication(values) {
  const errors = {};
  for (const field of BASIC_FIELDS) {
    if (!values[field.name].trim()) errors[field.name] = `Please enter your ${field.label.toLowerCase()}.`;
  }
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Please enter a valid email address.';
  if (!Object.values(values.contacts).some(value => value.trim())) errors.contacts = 'Please provide at least one contact method.';
  for (const [method, rawValue] of Object.entries(values.contacts)) {
    const value = rawValue.trim();
    if (!value) continue;
    if (method === 'phone' && (!/^\+?[\d\s().-]+$/.test(value) || value.replace(/\D/g, '').length < 6)) errors.phone = 'Please enter a valid phone number.';
    if (method === 'wechat' && /\s/.test(value)) errors.wechat = 'Please enter your WeChat ID without spaces.';
    if (method === 'discord' && (!/^[a-z0-9_.]{2,32}$/.test(value) || value.includes('..'))) errors.discord = 'Use your unique username, not your display name.';
  }
  return errors;
}

function EvaluationSuccess({ successRef }) {
  return <div className="eval-success">
    <header className="eval-success-summary">
      <span className="eval-success-icon" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
      </span>
      <h2 ref={successRef} tabIndex={-1} id="eval-success-heading">Application Submitted!</h2>
      <p>Thank you for your interest in RoboValue. Our team will contact you using the details provided in your application to coordinate the next steps.</p>
    </header>

    <footer className="eval-success-footer">
      <a className="eval-document-link" href="/doc/get-started/evaluation/"><Icon name="book" size={22} /><span>View Evaluation Workflow</span><Icon name="external" size={18} /></a>
    </footer>
  </div>;
}

export function EvaluationPage() {
  const [values, setValues] = useState({ teamName: '', organization: '', modelName: '', email: '' });
  const [contacts, setContacts] = useState({ phone: '', wechat: '', discord: '' });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now);
  const [submitting, setSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [application, setApplication] = useState(null);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);
  const formRef = useRef(null);
  const successRef = useRef(null);
  const noticeRef = useRef(null);
  const submittingRef = useRef(false);
  const requestRef = useRef(null);
  const submissionAttemptRef = useRef(null);
  const showSuccess = Boolean(application) || previewSubmitted;

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (showSuccess) successRef.current?.focus();
  }, [showSuccess]);
  useEffect(() => {
    if (notice && !submitting) noticeRef.current?.focus();
  }, [notice, submitting]);
  useEffect(() => {
    if (!notice?.retryAt) return;
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [notice]);
  const displayNotice = describeSubmissionNotice(notice, currentTime);

  function checkField(name, nextValues = values, nextContacts = contacts) {
    const validationErrors = validateApplication({ ...nextValues, contacts: nextContacts });
    setErrors(current => ({ ...current, [name]: validationErrors[name], ...(Object.hasOwn(CONTACT_METHODS, name) && (attemptedSubmit || current.contacts) ? { contacts: validationErrors.contacts } : {}) }));
  }

  function changeField(name, value) {
    if (value !== values[name]) submissionAttemptRef.current = null;
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    if (errors[name]) checkField(name, nextValues);
  }

  function changeContact(method, value) {
    if (value !== contacts[method]) submissionAttemptRef.current = null;
    const nextContacts = { ...contacts, [method]: value };
    setContacts(nextContacts);
    const validationErrors = validateApplication({ ...values, contacts: nextContacts });
    setErrors(current => ({ ...current, contacts: current.contacts ? validationErrors.contacts : undefined, [method]: current[method] ? validationErrors[method] : undefined }));
  }

  async function submitApplication(event) {
    event.preventDefault();
    if (SUBMISSION_MODE === 'review') return;
    if (submittingRef.current || describeSubmissionNotice(notice, Date.now()).waiting) return;
    const payload = { ...values, contacts };
    const validationErrors = validateApplication(payload);
    setAttemptedSubmit(true);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      const firstError = Object.keys(validationErrors)[0];
      const fieldName = firstError === 'contacts' ? 'phone' : firstError;
      formRef.current?.querySelector(`[name="${fieldName}"]:not(:disabled)`)?.focus();
      return;
    }
    if (SUBMISSION_MODE === 'preview') {
      setPreviewSubmitted(true);
      return;
    }
    if (!['api', 'cloudbase'].includes(SUBMISSION_MODE)) {
      setNotice(submissionNotice({ kind: 'unavailable' }));
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setNotice(null);
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const attempt = prepareSubmissionAttempt(payload, submissionAttemptRef.current);
      submissionAttemptRef.current = attempt;
      const result = await sendApplication(attempt, {
        mode: SUBMISSION_MODE,
        endpoint: import.meta.env.VITE_EVAL_API_URL,
        cloudbaseEnv: import.meta.env.VITE_EVAL_CLOUDBASE_ENV,
        publishableKey: import.meta.env.VITE_EVAL_CLOUDBASE_PUBLISHABLE_KEY,
        signal: controller.signal,
      });
      submissionAttemptRef.current = null;
      setApplication(result);
    } catch (error) {
      const time = Date.now();
      setCurrentTime(time);
      setNotice(submissionNotice(error, time));
    } finally {
      window.clearTimeout(timeout);
      submittingRef.current = false;
      requestRef.current = null;
      setSubmitting(false);
    }
  }

  const resultClass = showSuccess ? ' is-submitted' : '';

  function renderBasicField(field) {
    return <div className={`eval-field${field.name === 'modelName' ? ' eval-field-wide' : ''}`} key={field.name}>
      <label htmlFor={`eval-${field.name}`}>{field.label}<span className="eval-required" aria-hidden="true">*</span></label>
      <input id={`eval-${field.name}`} name={field.name} type={field.type || 'text'} value={values[field.name]} onChange={event => changeField(field.name, event.target.value)} onBlur={() => checkField(field.name)} required maxLength={field.maxLength} autoComplete={field.autoComplete} placeholder={field.placeholder} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `eval-${field.name}-error` : undefined} />
      {errors[field.name] && <p className="eval-field-error" id={`eval-${field.name}-error`}>{errors[field.name]}</p>}
    </div>;
  }

  return <main className={`eval-page${resultClass}`} id="main-content" tabIndex={-1}>
    {!resultClass && <header className="eval-heading">
      <h1>Apply for Evaluation</h1>
      <p className="eval-lede">Evaluation applications are paused during anonymous review.<br className="eval-intro-break" /> This form is for display only and does not send data.</p>
    </header>}

    <div className={`eval-layout${resultClass}`}>
      <section className={`eval-application${resultClass}`} aria-labelledby={showSuccess ? 'eval-success-heading' : 'eval-form-heading'}>
        {showSuccess ? <EvaluationSuccess successRef={successRef} /> : <>
          <div className="eval-form-heading"><h2 id="eval-form-heading">Application Details</h2><p><span aria-hidden="true">*</span> Required</p></div>
          <form ref={formRef} className="eval-form" onSubmit={submitApplication} noValidate aria-busy={submitting}>
            <fieldset className="eval-form-fields" disabled={submitting}>
              <legend className="sr-only">Application information</legend>
              <section className="eval-form-section" aria-labelledby="eval-team-heading">
                <h3 id="eval-team-heading">Team &amp; Model</h3>
                <div className="eval-field-grid">
                  {BASIC_FIELDS.filter(field => field.name !== 'email').map(renderBasicField)}
                </div>
              </section>
              <section className="eval-contact-group eval-form-section" aria-labelledby="eval-contact-heading">
                <h3 id="eval-contact-heading">Contact Information</h3>
                {renderBasicField(BASIC_FIELDS.find(field => field.name === 'email'))}
                <fieldset className="eval-contact-method" aria-describedby={errors.contacts ? 'eval-contacts-error' : undefined}>
                  <legend>Please provide at least one additional contact method.</legend>
                  <div className="eval-contact-grid">
                    {Object.entries(CONTACT_METHODS).map(([key, method]) => <div className="eval-field" key={key}>
                      <label htmlFor={`eval-contact-${key}`}>{method.fieldLabel}</label>
                      <input id={`eval-contact-${key}`} name={key} type={method.type || 'text'} value={contacts[key]} placeholder={method.placeholder} onChange={event => changeContact(key, event.target.value)} onBlur={() => checkField(key)} maxLength={method.maxLength} autoComplete={method.autoComplete} autoCapitalize="none" spellCheck={false} aria-invalid={!!errors[key] || !!errors.contacts} aria-describedby={[errors[key] && `eval-${key}-error`, errors.contacts && 'eval-contacts-error'].filter(Boolean).join(' ') || undefined} />
                      {errors[key] && <p className="eval-field-error" id={`eval-${key}-error`}>{errors[key]}</p>}
                    </div>)}
                  </div>
                  {errors.contacts && <p className="eval-field-error" id="eval-contacts-error">{errors.contacts}</p>}
                </fieldset>
              </section>
            </fieldset>
            {attemptedSubmit && Object.values(errors).some(Boolean) && <p className="eval-validation-summary" role="alert">Please check the highlighted fields before submitting.</p>}
            <div className={`eval-form-footer${displayNotice.waiting ? ' is-waiting' : ''}`}>
              <button className={`eval-submit${submitting ? ' is-loading' : ''}`} type="submit" disabled={SUBMISSION_MODE === 'review' || submitting || displayNotice.waiting} aria-describedby={notice ? 'eval-submission-status' : undefined}>
                {submitting && <span className="eval-submit-spinner" aria-hidden="true" />}
                {SUBMISSION_MODE === 'review' ? 'Unavailable During Review' : submitting ? 'Submitting…' : displayNotice.button}
                {!submitting && !notice && <Icon size={20} />}
              </button>
              {notice && !submitting && <>
                <p className="eval-submission-status" id="eval-submission-status" ref={noticeRef} tabIndex={-1} role="status">{displayNotice.message}</p>
              </>}
            </div>
          </form>
        </>}
      </section>
    </div>
  </main>;
}
