import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginWithEmail, signupWithEmail, loginWithGoogle } from './redux/authSlice';
import './LoginCss.css'
import Swal from 'sweetalert2'

const ActionPanel = ({ signIn, slide, setEmail, setPass }) => {
  const heading = signIn ? 'Hello friend!' : 'Welcome back!';
  const paragraph = signIn
    ? 'Enter your personal details and start your journey with us'
    : 'To keep connected with us please login with your personal info';
  const button = signIn ? 'Sign up!' : 'Sign in!';

  return (
    <div className="Panel ActionPanel">
      <h2>{heading}</h2>
      <p>{paragraph}</p>
      <button onClick={() => slide(setEmail, setPass)}>{button}</button>
    </div>
  );
};

const FormPanel = ({ signIn, email, setEmail, pass, setPass }) => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/main');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: 'You are not a registered member',
      });
    }
  }, [error]);

  const inputHandler = e => {
    if (e.target.id === 'email') {
      setEmail(e.target.value);
    } else {
      setPass(e.target.value);
    }
  };

  const heading = signIn ? 'Sign in' : 'Create account';
  const social = [
    { icon: 'Google' },
  ];
  const paragraph = 'Or use your email account';
  const inputs = [
    { type: 'text', placeholder: 'Email', id: "email" },
    { type: 'password', placeholder: 'Password', id: 'pass' }
  ];

  const link = { href: '#', text: 'Forgot your password?' };
  const button = signIn ? 'Sign in' : 'Sign up';

  const submitHandler = e => {
    e.preventDefault();
    if (signIn) {
      dispatch(loginWithEmail({ email, pass }));
    } else {
      dispatch(signupWithEmail({ email, pass }));
    }
  };
  
  const googleHandler = () => {
    dispatch(loginWithGoogle());
  };

  return (
    <div className="Panel FormPanel">
      <h2>{heading}</h2>
      <div className="Social">
        {social.map(({ icon }) => (
          <button key={icon} onClick={googleHandler}>
            {icon}
          </button>
        ))}
      </div>
      <p>{paragraph}</p>
      <form>
        {inputs.map(({ type, placeholder, id }) => (
          <input 
            id={id} 
            type={type} 
            key={placeholder} 
            placeholder={placeholder} 
            onChange={e => inputHandler(e)} 
            value={id === 'email' ? email : pass}
          />
        ))}
      </form>
      {signIn && <a href={link.href}>{link.text}</a>}
      <button onClick={submitHandler} id={button} disabled={loading}>
        {loading ? 'Loading...' : button}
      </button>
    </div>
  );
};

const Login = () => {
  const [signIn, setSignIn] = useState(true);
  const [transition, setTransition] = useState(false);
  const [pass, setPass] = useState('');
  const [email, setEmail] = useState('');

  const slide = useCallback((setPass, setEmail) => {
    setPass('');
    setEmail('');
    if (transition) return;

    const formPanel = document.querySelector('.FormPanel');
    const actionPanel = document.querySelector('.ActionPanel');
    const actionPanelChildren = actionPanel.children;

    const formBoundingRect = formPanel.getBoundingClientRect();
    const actionBoundingRect = actionPanel.getBoundingClientRect();

    formPanel.style.transition = 'all 0.7s cubic-bezier(.63,.39,.54,.91)';
    actionPanel.style.transition = 'all 0.7s cubic-bezier(.63,.39,.54,.91)';
    [...actionPanelChildren].forEach(
      (child) => (child.style.transition = 'all 0.35s cubic-bezier(.63,.39,.54,.91)')
    );

    setTransition(true);

    if (signIn) {
      formPanel.style.transform = `translateX(${actionBoundingRect.width}px)`;
      actionPanel.style.transform = `translateX(${-formBoundingRect.width}px)`;
      [...actionPanelChildren].forEach((child) => {
        child.style.transform = `translateX(${actionBoundingRect.width / 2}px)`;
        child.style.opacity = 0;
        child.style.visibility = 'hidden';
      });
      formPanel.style.borderRadius = '0 20px 20px 0';
      actionPanel.style.borderRadius = '20px 0 0 20px';
    } else {
      formPanel.style.transform = `translateX(${-actionBoundingRect.width}px)`;
      actionPanel.style.transform = `translateX(${formBoundingRect.width}px)`;
      [...actionPanelChildren].forEach((child) => {
        child.style.transform = `translateX(${-actionBoundingRect.width / 2}px)`;
        child.style.opacity = 0;
        child.style.visibility = 'hidden';
      });
      formPanel.style.borderRadius = '20px 0 0 20px';
      actionPanel.style.borderRadius = '0 20px 20px 0';
    }

    setTimeout(() => {
      [...actionPanelChildren].forEach((child) => {
        child.style.transition = 'none';
        child.style.transform = `translateX(${signIn ? -actionBoundingRect.width / 3 : actionBoundingRect.width / 3}%)`;
      });
      setSignIn(!signIn);
    }, 350);

    setTimeout(() => {
      [...actionPanelChildren].forEach((child) => {
        child.style.transition = 'all 0.35s cubic-bezier(.63,.39,.54,.91)';
        child.style.transform = 'translateX(0)';
        child.style.opacity = 1;
        child.style.visibility = 'visible';
      });
    }, 400);

    setTimeout(() => {
      formPanel.style.transition = 'none';
      actionPanel.style.transition = 'none';
      formPanel.style.transform = 'translate(0)';
      actionPanel.style.transform = 'translate(0)';
      actionPanel.style.order = signIn ? -1 : 1;
      setTransition(false);
    }, 700);
  }, [signIn, transition]);

  return (
    <>
      <h1 style={{display: 'flex', justifyContent: 'center', fontSize: '100px'}}>SmartModeler</h1>
      <div className="login">
        <FormPanel signIn={signIn} email={email} setEmail={setEmail} pass={pass} setPass={setPass}/>
        <ActionPanel signIn={signIn} slide={slide} setEmail={setEmail} setPass={setPass}/>
      </div>
    </>
  );
};

export default Login;