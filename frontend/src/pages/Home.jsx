import { useState } from 'react';
import { Link } from 'react-router-dom';
import HeroImage from '../assets/hero_image.png';
import { BarChart3, ShieldCheck, Zap, Users, Store, Building2, Check, ArrowRight } from 'lucide-react';

export default function Home() {
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen scroll-smooth bg-stone-50 text-stone-900">
            <nav className="fixed top-0 z-50 w-full border-b border-stone-200 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Link to="/" className="group flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg transition-transform group-hover:scale-105">
                            <span className="text-lg font-black">I</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-stone-900">Inventory</span>
                    </Link>

                    <div className="hidden items-center gap-10 text-sm font-semibold text-stone-600 md:flex">
                        <button onClick={() => scrollToSection('features')} className="transition-colors hover:text-stone-900">FEATURES</button>
                        <button onClick={() => scrollToSection('showcase')} className="transition-colors hover:text-stone-900">CAPABILITIES</button>
                        <button onClick={() => scrollToSection('testimonials')} className="transition-colors hover:text-stone-900">REVIEWS</button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link to="/login" className="text-sm font-semibold text-stone-600 transition-colors hover:text-stone-900">
                            Log in
                        </Link>
                        <Link to="/register" className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </nav>

            <header className="relative min-h-[90vh] overflow-hidden pt-20 md:min-h-screen">
                <img
                    src={HeroImage}
                    alt="Inventory management dashboard"
                    className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30"></div>

                <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-32 text-center text-white md:py-48">
                    <div className="mb-8 inline-block rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-semibold uppercase tracking-widest">
                        Precision Inventory Management
                    </div>

                    <h1 className="max-w-3xl text-5xl font-black leading-[1.1] md:text-7xl">
                        Your Stock, <br className="hidden sm:block" />
                        <span className="text-emerald-300">Perfectly Balanced</span>
                    </h1>

                    <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-200">
                        Run real-time stock tracking, supplier workflows, and sales intelligence with one system designed for teams that cannot afford costly inventory mistakes.
                    </p>

                    <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-8 py-4 text-lg font-bold text-white transition-all hover:-translate-y-1 hover:bg-emerald-800"
                        >
                            Start Free <ArrowRight className="h-5 w-5" />
                        </Link>
                        <button
                            onClick={() => scrollToSection('features')}
                            className="rounded-lg border-2 border-white/40 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                        >
                            Explore
                        </button>
                    </div>

                    <div className="mt-8 flex gap-6 text-sm text-gray-200">
                        <div className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-emerald-300" />
                            <span>14-day free trial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-emerald-300" />
                            <span>No credit card required</span>
                        </div>
                    </div>
                </div>
            </header>

            <section className="border-b border-stone-300 bg-white py-12">
                <div className="mx-auto max-w-7xl px-6 text-center">
                    <p className="mb-8 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Trusted by retail and warehouse operations</p>
                    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 text-base font-semibold text-stone-600">
                        <span>Urban Retail Group</span>
                        <span>Logistics Plus</span>
                        <span>Supply Hub</span>
                        <span>Warehouse Direct</span>
                        <span>Distribution Hub</span>
                    </div>
                </div>
            </section>

            <section id="showcase" className="bg-stone-50 py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mb-16 text-center">
                        <h2 className="text-5xl font-black text-stone-900 md:text-6xl">
                            Everything You Need <br /> to Scale Operations
                        </h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <div className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <Zap className="h-7 w-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-stone-900">Real-time Tracking</h3>
                            <p className="mt-4 leading-relaxed text-stone-600">
                                Monitor stock levels across locations as they change, with instant low-stock alerts and movement history.
                            </p>
                        </div>

                        <div className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <BarChart3 className="h-7 w-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-stone-900">Smart Reports</h3>
                            <p className="mt-4 leading-relaxed text-stone-600">
                                One-click reports on inventory trends, sales velocity, supplier performance, and profit drivers.
                            </p>
                        </div>

                        <div className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <Users className="h-7 w-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-stone-900">Supplier Workflow</h3>
                            <p className="mt-4 leading-relaxed text-stone-600">
                                Request, approve, deliver, and verify—all in one system with challan uploads and proof tracking.
                            </p>
                        </div>

                        <div className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                                <ShieldCheck className="h-7 w-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-stone-900">Secure by Design</h3>
                            <p className="mt-4 leading-relaxed text-stone-600">
                                Role-based access keeps admin, staff, and supplier views separate with full audit logging.
                            </p>
                        </div>

                        <div className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                                <Store className="h-7 w-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-stone-900">Sales Integration</h3>
                            <p className="mt-4 leading-relaxed text-stone-600">
                                Track sales orders, invoices, returns, and customer data all connected to your inventory spine.
                            </p>
                        </div>

                        <div className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                                <Building2 className="h-7 w-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-stone-900">Multi-user Ready</h3>
                            <p className="mt-4 leading-relaxed text-stone-600">
                                Scale your team with permission-aware workflows and notifications so everyone stays in sync.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="relative bg-gradient-to-br from-emerald-900 to-emerald-950 py-20 text-white">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative mx-auto max-w-7xl px-6">
                    <div className="mb-16 grid gap-12 lg:grid-cols-2 lg:items-center">
                        <div>
                            <h2 className="text-4xl font-black md:text-5xl">Perfect for Every Business Size</h2>
                            <p className="mt-5 text-lg leading-relaxed text-emerald-100">
                                From a single store to a multi-supplier wholesale operation, Inventory adapts to your workflow without forcing you to learn a new way of working.
                            </p>

                            <div className="mt-10 space-y-6">
                                <div className="flex gap-4">
                                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold">✓</div>
                                    <div>
                                        <h3 className="text-xl font-bold">Retail Operations</h3>
                                        <p className="mt-1 text-emerald-200">Point-of-sale sync and shelf-level stock visibility in real time.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold">✓</div>
                                    <div>
                                        <h3 className="text-xl font-bold">Wholesale</h3>
                                        <p className="mt-1 text-emerald-200">Bulk supplier orders, procurement cycles, and delivery tracking.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold">✓</div>
                                    <div>
                                        <h3 className="text-xl font-bold">Multi-team Warehouses</h3>
                                        <p className="mt-1 text-emerald-200">Separate roles keep operations safe and fast.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:mt-0">
                            <div className="rounded-2xl border border-emerald-700 bg-emerald-800/50 p-6 backdrop-blur">
                                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">Your dashboard gets</p>
                                <p className="mt-3 text-3xl font-black text-white">Real-time Updates</p>
                                <p className="mt-2 text-emerald-200">Sync happens instantly when stock moves.</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-700 bg-emerald-800/50 p-6 backdrop-blur">
                                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">Reports give you</p>
                                <p className="mt-3 text-3xl font-black text-white">One View</p>
                                <p className="mt-2 text-emerald-200">Sales, procurement, and stock in one place.</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-700 bg-emerald-800/50 p-6 backdrop-blur">
                                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">Suppliers can</p>
                                <p className="mt-3 text-3xl font-black text-white">Deliver Proof</p>
                                <p className="mt-2 text-emerald-200">Upload challans and invoice images instantly.</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-700 bg-emerald-800/50 p-6 backdrop-blur">
                                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">Inventory updates</p>
                                <p className="mt-3 text-3xl font-black text-white">Automatically</p>
                                <p className="mt-2 text-emerald-200">When staff verify delivery you're live.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="testimonials" className="bg-white py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mb-16 text-center">
                        <h2 className="text-4xl font-black text-stone-900 md:text-5xl">What Teams Are Saying</h2>
                        <p className="mt-4 text-lg text-stone-600">Real feedback from businesses using Inventory every day.</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8">
                            <p className="text-sm text-stone-600 leading-relaxed">
                                "We cut our inventory counting time in half. The real-time stock view changed everything about how fast we can reorder."
                            </p>
                            <p className="mt-6 font-semibold text-stone-900">Sam Patel</p>
                            <p className="text-xs text-stone-500">Retail Manager, Urban Stores</p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8">
                            <p className="text-sm text-stone-600 leading-relaxed">
                                "The supplier delivery workflow eliminates so much back-and-forth. Challans upload, we verify, and stock updates. Done."
                            </p>
                            <p className="mt-6 font-semibold text-stone-900">Maria Garcia</p>
                            <p className="text-xs text-stone-500">Operations Lead, Supply Hub</p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8">
                            <p className="text-sm text-stone-600 leading-relaxed">
                                "Having admin, staff, and supplier views all in one system means one less tool to manage. The role separation feels natural."
                            </p>
                            <p className="mt-6 font-semibold text-stone-900">Dev Kumar</p>
                            <p className="text-xs text-stone-500">Warehouse Owner, Distribution Hub</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="pricing" className="relative overflow-hidden bg-emerald-700 py-20">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div className="relative mx-auto max-w-5xl px-6 text-center text-white">
                    <h2 className="text-4xl font-black md:text-5xl">Ready to Take Control?</h2>
                    <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-emerald-100">
                        Join inventory teams that manage thousands in stock daily. Launch in minutes, no credit card required.
                    </p>

                    <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-bold text-emerald-700 transition-all hover:-translate-y-1"
                        >
                            Get Started Free <ArrowRight className="h-5 w-5" />
                        </Link>
                        <button
                            onClick={() => scrollToSection('features')}
                            className="rounded-lg border-2 border-white/50 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-white/10"
                        >
                            Learn More
                        </button>
                    </div>
                    <p className="mt-6 text-sm text-emerald-100">14-day full access. Cancel anytime.</p>
                </div>
            </section>

            <footer className="border-t border-stone-300 bg-stone-900 text-stone-400 py-12">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold">I</div>
                        <span className="font-bold text-white">Inventory</span>
                    </div>

                    <p className="text-sm">© 2026 Inventory. All rights reserved.</p>

                    <div className="flex gap-6 text-sm">
                        <a href="#" className="transition-colors hover:text-white">Privacy</a>
                        <a href="#" className="transition-colors hover:text-white">Terms</a>
                        <a href="#" className="transition-colors hover:text-white">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
