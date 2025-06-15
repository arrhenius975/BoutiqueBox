// src/app/help/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { LifeBuoy, MessageSquare, Phone } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold text-primary mb-4">Help Center</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find answers to your questions or get in touch with our support team.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="font-headline text-2xl font-semibold mb-6 text-center">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
          <AccordionItem value="item-1">
            <AccordionTrigger>How do I track my order?</AccordionTrigger>
            <AccordionContent>
              You can track your order status from the 'Account' page under 'Order History'. We also send email updates with tracking information once your order is shipped.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>What are the delivery charges?</AccordionTrigger>
            <AccordionContent>
              Delivery charges vary based on your location and order size. Standard delivery is often free for orders above a certain amount. Check the checkout page for specific charges.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>How can I change my delivery address?</AccordionTrigger>
            <AccordionContent>
              You can change your delivery address in your 'Account Settings' before an order is processed. If an order is already placed, please contact support immediately. (Address management coming soon!)
            </AccordionContent>
          </AccordionItem>
           <AccordionItem value="item-4">
            <AccordionTrigger>What is your return policy?</AccordionTrigger>
            <AccordionContent>
              We accept returns for most items within 14 days of delivery, provided they are in their original condition. Perishable goods are generally non-returnable. Please see our full return policy page for details.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="mb-12">
        <h2 className="font-headline text-2xl font-semibold mb-8 text-center">Contact Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <LifeBuoy className="h-12 w-12 mx-auto text-primary mb-2" />
              <CardTitle>Live Chat (Soon)</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Chat with our support team for quick assistance.</CardDescription>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline" disabled>Start Chat</Button>
            </CardFooter>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <MessageSquare className="h-12 w-12 mx-auto text-primary mb-2" />
              <CardTitle>Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Send us an email and we'll get back to you within 24 hours.</CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="mailto:support@boutiquebox.com">Send Email</Link>
              </Button>
            </CardFooter>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <Phone className="h-12 w-12 mx-auto text-primary mb-2" />
              <CardTitle>Phone Support (Soon)</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Call us at (555) 123-4567 during business hours.</CardDescription>
            </CardContent>
            <CardFooter>
               <Button asChild className="w-full" variant="outline" disabled>
                <Link href="tel:+15551234567">Call Us</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <div className="text-center mt-12">
        <Button asChild variant="link">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
