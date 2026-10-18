import React from 'react';import {render,screen} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {AuthProvider} from '../context/AuthContext';
import Login from './Login';
test('renders the sign-in form with seeded demo account',()=>{render(<BrowserRouter><AuthProvider><Login/></AuthProvider></BrowserRouter>);expect(screen.getByRole('button',{name:'Sign in'})).toBeInTheDocument();expect(screen.getByDisplayValue('demo@miniats-demo.com')).toBeInTheDocument()});
