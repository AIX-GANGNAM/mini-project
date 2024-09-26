import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginWithEmail, signupWithEmail, loginWithGoogle,signupWithGoogle } from './redux/authSlice';
import './LoginCss.css'
import Swal from 'sweetalert2'

const ActionPanel = ({ isSignIn, onModeChange, setEmail, setPass }) => {
  const heading = isSignIn ? 'Hello friend!' : 'Welcome back!';
  const paragraph = isSignIn
    ? 'Enter your personal details and start your journey with us'
    : 'To keep connected with us please login with your personal info';
  const button = isSignIn ? 'Sign up!' : 'Sign in!';

  const handleModeChange = () => {
    setEmail('');
    setPass('');
    onModeChange();
  };

  return (
    <div className="Panel ActionPanel">
      <h2>{heading}</h2>
      <p>{paragraph}</p>
      <button onClick={handleModeChange}>{button}</button>
    </div>
  );
};

const FormPanel = ({ isSignIn, email, setEmail, pass, setPass }) => {
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
        text: error,
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

  const heading = isSignIn ? 'Sign in' : 'Create account';
  const social = [
    { icon: 'Google' },
  ];
  const paragraph = 'Or use your email account';
  const inputs = [
    { type: 'text', placeholder: 'Email', id: "email" },
    { type: 'password', placeholder: 'Password', id: 'pass' }
  ];

  const link = { href: '#', text: 'Forgot your password?' };
  const button = isSignIn ? 'Sign in' : 'Sign up';

  const submitHandler = e => {
    
    e.preventDefault();
    if (isSignIn) {
      dispatch(loginWithEmail({ email, pass }));
    } else {
      
      dispatch(signupWithEmail({ email, pass }))
        .unwrap()
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Account created successfully. Please log in.",
          });
        })
        .catch((error) => {
          // Error handling is done in the useEffect above
        });
    }
  };
  
  const googleHandler = () => {
    if(isSignIn){
      dispatch(loginWithGoogle());
    }else{
      dispatch(signupWithGoogle())
      .unwrap()
      .then((user) => {
        console.log('Successfully signed up with Google', user);
        // 추가적인 회원가입 후 처리 로직
      })
      .catch((error) => {
        console.error('Google signup failed:', error);
        // 에러 처리 로직
      });
    }
    
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
            onChange={inputHandler} 
            value={id === 'email' ? email : pass}
            required
          />
        ))}
        <button type="submit" disabled={loading} onClick={submitHandler}>
          {loading ? 'Loading...' : button}
        </button>
      </form>
      {isSignIn && <a href={link.href}>{link.text}</a>}
    </div>
  );
};

const Login = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [transition, setTransition] = useState(false);
  const [pass, setPass] = useState('');
  const [email, setEmail] = useState('');

  const toggleMode = useCallback(() => {
    setIsSignIn(prev => !prev);
  }, []);

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

    if (isSignIn) {
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
        child.style.transform = `translateX(${isSignIn ? -actionBoundingRect.width / 3 : actionBoundingRect.width / 3}%)`;
      });
      toggleMode();
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
      actionPanel.style.order = isSignIn ? -1 : 1;
      setTransition(false);
    }, 700);
  }, [isSignIn, transition, toggleMode]);

  return (
    <>
      <h1 style={{display: 'flex', justifyContent: 'center', fontSize: '100px'}}>SmartModeler</h1>
      <div className="login">
        <FormPanel isSignIn={isSignIn} email={email} setEmail={setEmail} pass={pass} setPass={setPass}/>
        <ActionPanel isSignIn={isSignIn} onModeChange={slide} setEmail={setEmail} setPass={setPass}/>
      </div>
    </>
  );
};

export default Login;