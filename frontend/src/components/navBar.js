import React, { useContext } from "react"
import { Link, useLocation } from 'react-router-dom'
import { ProductContext } from "../ProductContext"

const NavBar = () => {
    const [products, setProducts] = useContext(ProductContext)
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/' || location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    const navLinkStyle = (path) => ({
        color: 'white',
        textDecoration: 'none',
        padding: '10px 18px',
        borderRadius: '8px',
        backgroundColor: isActive(path) ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    });

    return (
        <nav style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '12px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 15px rgba(102, 126, 234, 0.3)',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            <Link to="/" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none'
            }}>
                <span style={{ fontSize: '28px' }}>🎵</span>
                <span style={{
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                }}>
                    Music Academy
                </span>
            </Link>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Link to="/" style={navLinkStyle('/')}>
                    🏠 Dashboard
                </Link>
                <Link to="/students" style={navLinkStyle('/students')}>
                    👥 Students
                </Link>
                <Link to="/payments" style={navLinkStyle('/payments')}>
                    💰 Payments
                </Link>
            </div>
        </nav>
    );
}

export default NavBar;