import React from 'react';
import * as L from 'lucide-react-native';

// Los tipos de lucide-react-native no aceptan `color` (SvgProps incompleto): se tipan aquí una sola vez.
export type IconComponent = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number; style?: any }>;
const c = (i: unknown) => i as IconComponent;

export const X = c(L.X);
export const Home = c(L.Home);
export const CalendarDays = c(L.CalendarDays);
export const Building2 = c(L.Building2);
export const MessageSquare = c(L.MessageSquare);
export const Menu = c(L.Menu);
export const UserPlus = c(L.UserPlus);
export const Users = c(L.Users);
export const Bike = c(L.Bike);
export const Package = c(L.Package);
export const Mail = c(L.Mail);
export const CreditCard = c(L.CreditCard);
export const PlusCircle = c(L.PlusCircle);
export const Contact = c(L.Contact);
export const CheckCircle = c(L.CheckCircle);
export const XCircle = c(L.XCircle);
export const Clock = c(L.Clock);
