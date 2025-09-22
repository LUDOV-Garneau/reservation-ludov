'use client';
import { PrimeReactProvider, PrimeReactStyleSheet } from '@primereact/core';
import { useServerInsertedHTML } from 'next/navigation';
import * as React from 'react';
import Aura from '@primeuix/themes/aura';

const styledStyleSheet = new PrimeReactStyleSheet();

export default function PrimeSSRProvider({
    children
}: Readonly<{
    children?: React.ReactNode;
}>) {
    useServerInsertedHTML(() => {
        const styleElements = styledStyleSheet.getAllElements();

        styledStyleSheet.clear();

        return <>{styleElements}</>;
    });

    const primereact = {
        theme: {
            preset: Aura
        }
    };

    return (
        <PrimeReactProvider {...primereact} stylesheet={styledStyleSheet}>
            {children}
        </PrimeReactProvider>
    );
}
