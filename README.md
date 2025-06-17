# 🛍️ BoutiqueBox - Modern Multi-Section E-Commerce App

BoutiqueBox is a sleek, full-stack e-commerce web application built using **Next.js 14+, App Router**, **Supabase**, **Tailwind CSS**, and **ShadCN UI**. Designed to handle multiple product sections (Grocery, Cosmetics, Fast Food), it includes a complete user and admin experience — from authentication and product browsing to AI-powered recommendations and order management.

---

## 🚀 Features

### 👤 User Functionality

- ✨ **Modern UI** with Tailwind + ShadCN components
- 🔐 **User Authentication** (Sign Up, Sign In, Sign Out, Email Verification)
- 🔍 **Product Browsing** by category, with search and filters
- ❤️ **Wishlist Management**
- 🛒 **Shopping Cart**
- 🤖 **AI-Based Personalized Recommendations**
- 🧾 **Checkout System** (Order creation with QR-based payment handling)
- 🧑‍💼 **User Profile** (View/update avatar and name)
- 📜 **Order History**
- ⭐ **Product Reviews**
- 🔒 **Account Deletion** (Removes user and storage data)
- 🆘 **Help Page** (Coming soon: Chat & Call support)

### 🛠️ Admin Functionality

- 📊 **Admin Dashboard** (Revenue and user signup charts)
- 📦 **Product Management** (CRUD, stock control)
- 🗂️ **Category Management**
- 📃 **Order Management** (View, update status)
- 👥 **User Management**
- 🔧 **App Settings Page** (Banner and global settings support)
- 🔐 **Admin Role-Based Access Control** via Supabase RLS
- 🚪 **Admin Logout**

---

## 🧰 Tech Stack

| Frontend         | Backend           | Dev Tools                  |
|------------------|-------------------|----------------------------|
| Next.js 14+ (App Router) | Supabase (Auth, DB, Storage) | Tailwind CSS              |
| TypeScript       | PostgreSQL        | ShadCN UI (via Radix + Tailwind Merge) |
| React Context    | Supabase Auth Helpers | ESLint, Prettier, Turbo CLI |

---

## 🧪 Setup Instructions

### 1. 📦 Clone the repo & install dependencies

```bash
git clone https://github.com/yourusername/boutiquebox.git
cd boutiquebox
npm install
```

### 2. ⚙️ Environment Variables

Create a `.env.local` file and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. 🧱 Run Locally

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000) or the port you specify.

---

## 🧠 Database Schema

### Tables

- `auth.users` (Supabase managed)
- `public.users` — Custom user table
- `products` — Product metadata
- `categories` — Product categories
- `orders` — Order history
- `order_items` — Items in each order
- `reviews` — Product reviews
- `app_settings` — Global banner/settings storage

### Important: Trigger to sync new auth users to `public.users`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    'customer'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

## ✅ Production Checklist

- [x] **Supabase RLS** enabled and tested
- [x] **Email Verification** flow tested
- [x] **Role-based Admin Access**
- [x] Initial Product Data Populated
- [x] Environment Variables Set
- [x] API Routes Secured
- [x] Performance & A11y tested (Lighthouse)
- [x] Proper Indexes on Supabase DB
- [x] `app_settings` table created (for persistent settings)

---

## 👨‍💻 Admin Setup

1. Log in with your account.
2. Go to **Supabase Dashboard > Table Editor > public.users**.
3. Find your user and set the `role` column to `'admin'`.
4. Save changes and re-login in the app to access `/admin`.

---

## 🧠 Ideas for Future Improvements

- Saved Addresses
- Payment Gateways (Stripe, Razorpay)
- SMS / WhatsApp Notifications
- Live Chat Integration (e.g., Crisp, Intercom)
- Delivery Tracking System

---


## 🙌 Credits

- Supabase for Backend as a Service
- ShadCN UI for Tailwind Components
- Next.js for App Router & Fullstack support

---

## 📬 Contact

**Developer:** Zak  
📧 Email: zakariatalukdar123@gmail.com  
🌐 GitHub: [@yourgithub]([[https://github.com/yourgithub](https://github.com/arrhenius975)])
