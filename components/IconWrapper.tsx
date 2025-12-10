import React from 'react';

/**
 * Generic wrapper for Lucide icons that provides a consistent API and optional
 * default size/color. It receives the actual icon component as a prop and forwards
 * any additional props to it.
 */
interface IconWrapperProps extends React.SVGProps<SVGSVGElement> {
    /** The icon component imported from 'lucide-react' */
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    /** Optional size override (default 20) */
    size?: number;
    /** Optional color override */
    color?: string;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ Icon, size = 20, color, ...rest }) => {
    return <Icon width={size} height={size} stroke={color} {...rest} />;
};
