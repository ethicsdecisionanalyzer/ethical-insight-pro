import { Link } from "react-router-dom";
import { ArrowLeft, Shield, BookOpen, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header variant="page" />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Button variant="ghost" size="sm" asChild className="mb-4 gap-1">
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </Button>

            <h1 className="text-2xl font-bold text-foreground mb-8">About / Information</h1>

            {/* Attribution */}
            <section className="card-professional p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Attribution</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                From <em>Ethical Decision-making in Occupational and Environmental Health and Safety: A Comparative Case Study Approach</em>, Copyright © 2026 by John Wiley & Sons, Inc. Used by arrangement with John Wiley & Sons, Inc.
              </p>
            </section>

            {/* Data Use & Confidentiality */}
            <section className="card-professional p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Data Use & Confidentiality</h2>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Data is stored securely and access is session-based.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  No identifiable data will be published.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Submitted data may be used in anonymized, aggregate form for research purposes only.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  This tool does not provide legal, medical, or professional advice.
                </li>
              </ul>
            </section>

            {/* Disclaimer */}
            <section className="card-professional p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Disclaimer</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This tool provides a structured analytical framework and does not constitute legal, medical, or professional advice. Independent professional judgment remains essential.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
