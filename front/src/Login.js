import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginCss.css'

const ActionPanel = ({ signIn, slide }) => {
  const heading = signIn ? 'Hello friend!' : 'Welcome back!';
  const paragraph = signIn
    ? 'Enter your personal details and start your journey with us'
    : 'To keep connected with us please login with your personal info';
  const button = signIn ? 'Sign up!' : 'Sign in!';

  return (
    <div className="Panel ActionPanel">
      <h2>{heading}</h2>
      <p>{paragraph}</p>
      <button onClick={slide}>{button}</button>
    </div>
  );
};

const FormPanel = ({ signIn }) => {
  const heading = signIn ? 'Sign in' : 'Create account';
  const social = [
    { href: '#', icon: 'google' },
  ];
  const paragraph = 'Or use your email account';
  const inputs = [
    { type: 'text', placeholder: 'Email' },
    { type: 'password', placeholder: 'Password' }
  ];
  
  if (!signIn) {
    inputs.unshift({ type: 'text', placeholder: 'Name' });
  }

  const link = { href: '#', text: 'Forgot your password?' };
  const button = signIn ? 'Sign in' : 'Sign up';

  const onClickHandler=e=>{
    if(signIn){
        window.location.href='/main'
    }
    
  }


  return (
    <div className="Panel FormPanel">
      <h2>{heading}</h2>
      <div className="Social">
        {social.map(({ href, icon }) => (
          <a href={href} key={icon}>
            {icon}
          </a>
        ))}
      </div>
      <p>{paragraph}</p>
      <form>
        {inputs.map(({ type, placeholder }) => (
          <input type={type} key={placeholder} placeholder={placeholder} />
        ))}
      </form>
      <a href={link.href}>{link.text}</a>
      <button onClick={e=>onClickHandler(e)} id={button}>{button}</button>
    </div>
  );
};



const Login = () => {
  const [signIn, setSignIn] = useState(true);
  const [transition, setTransition] = useState(false);

  const slide = useCallback(() => {
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
        <h1 style={{display : 'flex', justifyContent : 'center', fontSize : '100px'}}>SmartModeler</h1>
        <div className="login">
            <FormPanel signIn={signIn} />
            <ActionPanel signIn={signIn} slide={slide} />
        </div>
    </>
  );
};

export default Login;