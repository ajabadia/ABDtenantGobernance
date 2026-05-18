'use client';

import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

interface DashboardActionCardProps {
  icon: LucideIcon;
  category: string;
  title: string;
  description: string;
  footerLabel: string;
  footerValue: string;
  buttonText: string;
  href: string;
}

export function DashboardActionCard({
  icon: Icon,
  category,
  title,
  description,
  footerLabel,
  footerValue,
  buttonText,
  href,
}: DashboardActionCardProps) {
  return (
    <Card className="p-8 bg-card border-border rounded-xl flex flex-col justify-between min-h-[340px] transition-all hover:border-primary/20 hover:bg-accent/10 group shadow-sm">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="p-3 bg-secondary/50 border border-border group-hover:border-primary/30 group-hover:bg-primary/10 transition-all rounded-lg">
            <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground bg-secondary px-2.5 py-1 rounded">
            {category}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold uppercase tracking-tight italic text-foreground group-hover:text-primary transition-colors">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <Separator className="bg-border" aria-hidden="true" />
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          <span>{footerLabel}</span>
          <span className="text-primary font-bold">{footerValue}</span>
        </div>
        <Button className="rounded-lg font-mono text-[10px] tracking-widest uppercase h-12 w-full mt-2 font-bold" asChild>
          <Link href={href}>
            {buttonText}
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
