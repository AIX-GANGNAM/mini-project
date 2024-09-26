import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword ,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth } from '../firebase/config';

const handleAuthError = (error) => {
  console.error('Authentication error:', error);
  return error.message || 'An unknown error occurred';
};

export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async ({ email, pass }, { rejectWithValue }) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      return result.user;
    } catch (error) {
      return rejectWithValue(handleAuthError(error));
    }
  }
);

export const signupWithEmail = createAsyncThunk(
  'auth/signupWithEmail',
  async ({ email, pass }, { rejectWithValue }) => {
    try {
        console.log('회원가입 기능 구현 ?')
        console.log(pass)
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      return result.user;
    } catch (error) {
      return rejectWithValue(handleAuthError(error));
    }
  }
);

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      return rejectWithValue(handleAuthError(error));
    }
  }
);

export const signupWithGoogle = createAsyncThunk(
    'auth/signupWithGoogle',
    async (_, { rejectWithValue }) => {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // 이미 존재하는 계정인지 확인
        const methods = await fetchSignInMethodsForEmail(auth, user.email);
        
        if (methods.length === 0) {
          // 새 사용자인 경우, 추가적인 회원가입 로직을 여기에 구현할 수 있습니다.
          // 예: 사용자 프로필 정보를 데이터베이스에 저장
          console.log('New user signed up with Google');
          return user;
        } else {
          // 이미 존재하는 사용자
          return rejectWithValue('User already exists. Please login instead.');
        }
      } catch (error) {
        return rejectWithValue(handleAuthError(error));
      }
    }
  );

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Login failed:', action.payload);
      })
      .addCase(signupWithEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupWithEmail.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(signupWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Signup failed:', action.payload);
      })
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Google login failed:', action.payload);
      })
      .addCase(signupWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupWithGoogle.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(signupWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Google signup failed:', action.payload);
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;