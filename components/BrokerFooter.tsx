import React from 'react';
import { Footer, FooterProps } from './Footer';

// This is essentially a wrapper to enforce proper usage and perhaps future-proof style overrides
export const BrokerFooter: React.FC<FooterProps> = (props) => {
    return (
        <Footer
            {...props}
            isBrokerPage={true}
        // We can enforce specific overrides here if needed, 
        // but the prop 'isBrokerPage' on the main Footer already handles most logic.
        />
    );
};
