import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { User, Mail, Lock, AlertCircle, UserPlus, Crown, Users } from 'lucide-react';

const SignupPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic client-side validation
        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsSubmitting(true);
        try {
            await register(formData.name.trim(), formData.email.trim(), formData.password, formData.role);
            // register already stores token and user in localStorage via context
            navigate('/');
        } catch (err) {
            setError(err.message || err.toString() || 'Signup failed. Please check your information and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 md:p-8 space-y-8 bg-white shadow-xl">
                <div className="text-center space-y-2">
                    <div className="mx-auto bg-primary-main text-white p-3 rounded-full w-fit">
                        <UserPlus size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
                    <p className="text-slate-500">Join us to manage your billing efficiently</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <Input
                                    className="pl-10"
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <Input
                                    className="pl-10"
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <Input
                                    className="pl-10"
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Account Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${formData.role === 'admin'
                                        ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    <Crown className="h-6 w-6" />
                                    <span className="font-semibold text-sm">Admin</span>
                                    <span className="text-xs text-center opacity-75">Full access</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'employee' })}
                                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${formData.role === 'employee'
                                        ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    <Users className="h-6 w-6" />
                                    <span className="font-semibold text-sm">Employee</span>
                                    <span className="text-xs text-center opacity-75">Limited access</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button className="w-full h-10" variant="primary" type="submit" isLoading={isSubmitting}>
                        Sign Up
                    </Button>

                    <div className="text-center mt-4">
                        <p className="text-body-secondary text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-main hover:underline font-medium">
                                Log in
                            </Link>
                        </p>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default SignupPage;
