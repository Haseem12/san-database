// src/app/report/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText as ReportIcon } from "lucide-react";

export default function ApplicationReportPage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between pb-4 mb-4 border-b print:hidden">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center">
          <ReportIcon className="mr-3 h-7 w-7" />
          Application Report
        </h1>
        <Button onClick={handlePrint} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download as PDF
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">SAJ Foods Database Application Report</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert">
          <section className="mb-6">
            <h2 className="text-xl font-semibold mt-4 mb-2">1. Introduction</h2>
            <p>
              The SAJ Foods Database application is a web-based system designed to manage various business operations for SAJ Foods, focusing on accounting, sales, inventory, and customer/supplier relationships. It provides a user-friendly interface for recording transactions, tracking stock, managing financial documents, and viewing overall business activities. The application utilizes a modern web frontend built with Next.js and React, interacting with a PHP backend hosted at <code>sajfoods.net</code> for data persistence.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mt-4 mb-2">2. About SAJ Foods Limited (The Client)</h2>
            <p>
              <strong>SAJ Foods Limited</strong><br />
              RC No. RC510611L<br />
              KM 142 Kano-Kaduna Expressway, Maraban Gwanda<br />
              Sabon-Gari, Zaria, Kaduna State, Nigeria<br />
              <br />
              <strong>Phone:</strong> +234 (0) 817 070 7020, +234 (0) 807 654 5454<br />
              <strong>Email:</strong> info@sajfoods.net<br />
              <strong>Website:</strong> sajfoods.net
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mt-4 mb-2">3. About the System (SAJ Foods Database)</h2>
            <p>
              The SAJ Foods Database system aims to be a comprehensive, tailored solution for SAJ Foods, addressing the specific needs of their operations. It streamlines daily tasks such as recording sales, managing invoices and receipts, tracking product inventory from raw materials to finished goods, and maintaining detailed ledger accounts for customers and suppliers. By centralizing these functions, the system enhances operational efficiency, provides better visibility into financial and inventory data, and supports informed decision-making. Its modular design allows for focused management of different business areas while ensuring data flows consistently across the application.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mt-4 mb-2">4. About the Developers (SageNet International)</h2>
            <p>
              This application, the SAJ Foods Database, is developed and maintained by <strong>SageNet International</strong>, a technology solutions provider based in Abuja, Nigeria. SageNet International is dedicated to empowering businesses through innovative and tailored technology services. Their expertise spans a wide range of tech solutions, including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Custom Software Development:</strong> Designing and building bespoke software applications (web, desktop, and enterprise) to meet specific client needs and streamline complex business processes.</li>
              <li><strong>Web Application Development:</strong> Creating modern, responsive, and scalable web applications using cutting-edge frameworks and technologies, focusing on user experience and robust functionality.</li>
              <li><strong>Mobile Application Development:</strong> Developing native and cross-platform mobile apps for iOS and Android to extend business reach and enhance customer engagement.</li>
              <li><strong>Cloud Solutions &amp; Services:</strong> Assisting businesses with cloud migration, infrastructure setup (IaaS, PaaS, SaaS), and management on platforms like AWS, Azure, and Google Cloud to improve scalability, reliability, and cost-efficiency.</li>
              <li><strong>Data Analytics & Business Intelligence:</strong> Helping organizations harness the power of their data through advanced analytics, data visualization, and BI tools to drive insights and informed decision-making.</li>
              <li><strong>IT Consulting &amp; Strategy:</strong> Providing expert advice and strategic planning to help businesses leverage technology effectively, optimize IT infrastructure, and achieve their digital transformation goals.</li>
              <li><strong>Cybersecurity Solutions:</strong> Offering services to protect business assets from cyber threats, including security assessments, network security, and data protection strategies.</li>
            </ul>
            <p>
              SageNet International prides itself on understanding the unique challenges faced by businesses and leveraging modern technologies to deliver efficient, scalable, and impactful solutions.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mt-4 mb-2">5. Application Functionality (Key Modules)</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dashboard:</strong> Provides a high-level overview of key business metrics, quick actions, and recent activities, fetching data from live backend endpoints.</li>
              <li><strong>Overall Activities:</strong> A consolidated log of all major transactions (sales, invoices, receipts, credit notes, purchases, material usage) with filtering capabilities, powered by real-time data.</li>
              <li><strong>Sales Management:</strong> Allows recording new sales transactions, specifying customer and product details, and automatically generating associated invoices which are saved to the backend.</li>
              <li><strong>Invoice Management:</strong> Enables creation, viewing, editing, and deletion of customer invoices, with data persisted on the server. Includes features for printing and exporting invoices.</li>
              <li><strong>Receipts Management:</strong> Facilitates recording customer payments, linking them to ledger accounts, and maintaining a log of all receipts, all interacting with the live database.</li>
              <li><strong>Credit Notes Management:</strong> Allows issuing credit notes for various reasons (e.g., returned goods, expense reimbursements, damages), which adjust ledger account balances by interacting with the backend. Stock adjustments for returned goods are also handled.</li>
              <li><strong>Purchase Order Management:</strong> Manages purchase orders for raw materials/store items from suppliers, including item details (typed names and categories), costs, and status tracking, with data saved to the server.</li>
              <li><strong>Product Management (Finished Goods):</strong>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Catalog for finished goods (e.g., yogurts) with details like name, SKU, category, pricing (including tiered pricing), and stock levels, all managed via backend interactions.</li>
                  <li>Stock management features to view current stock and add new stock for finished products, updating the database in real-time.</li>
                </ul>
              </li>
              <li><strong>Store Management (Raw Materials & Items):</strong>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Manages inventory of raw materials and other store items, including stock levels, cost prices, and supplier information, fetched from and saved to the backend.</li>
                  <li>Allows recording the usage of these materials by different departments (e.g., Production, Packaging), which deducts from stock in the database.</li>
                </ul>
              </li>
              <li><strong>Ledger Accounts Management:</strong> Manages a chart of accounts, including customers, suppliers, sales representatives, and other account types. It stores contact details, credit terms, and price level information. The detail view for a ledger account provides a comprehensive history of associated invoices, receipts, and credit notes, along with an outstanding balance calculation, all based on live data.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mt-4 mb-2">6. Technology Stack</h2>
            <h3 className="text-lg font-medium mt-3 mb-1">Frontend:</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Framework:</strong> Next.js (App Router)</li>
              <li><strong>UI Library:</strong> React with TypeScript</li>
              <li><strong>Component Library:</strong> ShadCN UI (built on Radix UI primitives)</li>
              <li><strong>Styling:</strong> Tailwind CSS</li>
              <li><strong>Icons:</strong> Lucide React</li>
              <li><strong>Date Handling:</strong> <code>date-fns</code></li>
              <li><strong>State Management:</strong> Primarily React Hooks (<code>useState</code>, <code>useEffect</code>, <code>useMemo</code>, <code>useCallback</code>).</li>
              <li><strong>Form Handling:</strong> Controlled components.</li>
              <li><strong>Data Fetching (Client-Side):</strong> Browser <code>fetch</code> API to interact with the PHP backend.</li>
            </ul>
            <h3 className="text-lg font-medium mt-3 mb-1">Backend:</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Language:</strong> PHP</li>
              <li><strong>API Style:</strong> Custom RESTful API endpoints.</li>
              <li><strong>Hosting:</strong> Hosted on <code>sajfoods.net</code> (likely on a LAMP/LEMP stack).</li>
              <li><strong>Data Format:</strong> JSON for request and response bodies.</li>
            </ul>
            <h3 className="text-lg font-medium mt-3 mb-1">Database:</h3>
            <ul className="list-disc pl-6 space-y-1">
             <li>MySQL (as per provided schemas and PHP scripts).</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mt-4 mb-2">7. Key Dependencies & Libraries</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Core:</strong> <code>next</code>, <code>react</code>, <code>react-dom</code>.</li>
              <li><strong>UI & Styling:</strong>
                <code>@radix-ui/*</code> (various packages),
                <code>class-variance-authority</code>, <code>clsx</code>, <code>tailwind-merge</code>,
                <code>tailwindcss-animate</code>, <code>lucide-react</code>,
                <code>recharts</code> (dependency present for potential future charting).
              </li>
              <li><strong>Forms & Validation:</strong> Standard React state and event handling.</li>
              <li><strong>Utilities:</strong> <code>date-fns</code>, <code>uuid</code> (if used client-side).</li>
              <li><strong>Firebase SDK & Tanstack Query (Previous Stage):</strong> Dependencies like <code>firebase</code>, <code>react-firebase-hooks</code>, <code>@tanstack-query-firebase/react</code>, <code>@tanstack/react-query</code> were part of an earlier development phase. Current architecture primarily uses direct <code>fetch</code> to PHP.</li>
              <li><strong>Genkit (`@genkit-ai/*`, `genkit`):</strong> Present for potential AI features, not central to current CRUD.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mt-4 mb-2">8. Deployment Architecture</h2>
            <h3 className="text-lg font-medium mt-3 mb-1">Frontend (Next.js Application):</h3>
             <ul className="list-disc pl-6 space-y-1">
                <li>Deployed to a platform supporting Node.js (e.g., Vercel, Netlify, AWS Amplify, Google Cloud Run, Azure App Service, or a self-hosted Node.js server).</li>
                <li>Makes API calls to the separate PHP backend.</li>
             </ul>
            <h3 className="text-lg font-medium mt-3 mb-1">Backend (PHP Application):</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Hosted on a web server (e.g., Apache or Nginx with PHP-FPM) at <code>sajfoods.net</code>.</li>
              <li>PHP scripts interact directly with the MySQL database.</li>
            </ul>
            <h3 className="text-lg font-medium mt-3 mb-1">Database (MySQL):</h3>
            <ul className="list-disc pl-6 space-y-1">
             <li>Hosted on a server accessible to the PHP backend.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mt-4 mb-2">9. Potential Future Enhancements (Suggestions)</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Robust User Authentication & Authorization:</strong> Implement a secure authentication system to manage user roles and permissions.</li>
              <li><strong>Optimized Backend Endpoints:</strong> For dashboard summaries and high-traffic lists, create specific backend endpoints that return pre-aggregated data to improve performance rather than fetching all records client-side.</li>
              <li><strong>Error Monitoring & Logging:</strong> Integrate comprehensive error monitoring (e.g., Sentry) for both frontend and backend.</li>
              <li><strong>Advanced Reporting & Analytics:</strong> Develop dedicated reporting modules, potentially using <code>recharts</code>.</li>
              <li><strong>Server-Side Validation:</strong> Further strengthen server-side (PHP) validation for all incoming data.</li>
              <li><strong>Testing:</strong> Implement unit, integration, and end-to-end tests.</li>
              <li><strong>Real-time Features:</strong> For elements like stock levels or live activity feeds, explore WebSockets or Server-Sent Events if necessary.</li>
              <li><strong>Transaction Management:</strong> Ensure all database operations that involve multiple table updates are wrapped in robust database transactions in the PHP backend to maintain data integrity.</li>
            </ul>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
