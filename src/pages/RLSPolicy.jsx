import { motion } from "framer-motion";
import { Shield, Lock, Users, Database, Eye, EyeOff, Check, X } from "lucide-react";

const RLS_CATEGORIES = [
  {
    icon: Users,
    title: "1. User Entity",
    description: "Controls access to user account information and profiles",
    rules: [
      {
        operation: "Read (List)",
        roles: ["Admin"],
        condition: "Admins can view all user records",
        sql: "role = 'admin'"
      },
      {
        operation: "Read (Single)",
        roles: ["All Users"],
        condition: "Users can only view their own profile",
        sql: "email = auth.current_user_email()"
      },
      {
        operation: "Update",
        roles: ["All Users"],
        condition: "Users can only update their own profile",
        sql: "email = auth.current_user_email()"
      },
      {
        operation: "Delete",
        roles: ["Admin"],
        condition: "Only admins can delete user accounts",
        sql: "role = 'admin'"
      }
    ]
  },
  {
    icon: Database,
    title: "2. Customer Data Entities",
    description: "Reservation, Order, Invoice, and Customer Profile data",
    rules: [
      {
        operation: "Read (Reservations)",
        roles: ["Admin", "Staff"],
        condition: "Staff can view all reservations for operational purposes",
        sql: "role IN ('admin', 'staff')"
      },
      {
        operation: "Read (Own Reservations)",
        roles: ["User"],
        condition: "Users can only view their own reservations",
        sql: "email = auth.current_user_email()"
      },
      {
        operation: "Create (Reservations)",
        roles: ["All Users"],
        condition: "Any authenticated user can create a reservation",
        sql: "auth.is_authenticated()"
      },
      {
        operation: "Read (Invoices)",
        roles: ["Admin", "Staff"],
        condition: "Staff can view all invoices for payment processing",
        sql: "role IN ('admin', 'staff')"
      },
      {
        operation: "Read (Own Invoices)",
        roles: ["User"],
        condition: "Users can view their own invoice history",
        sql: "customer_email = auth.current_user_email()"
      },
      {
        operation: "Update (Invoices)",
        roles: ["Admin"],
        condition: "Only admins can modify invoice records",
        sql: "role = 'admin'"
      },
      {
        operation: "Read (Customer Profiles)",
        roles: ["Admin", "Staff"],
        condition: "Staff can view customer profiles for service",
        sql: "role IN ('admin', 'staff')"
      },
      {
        operation: "Read/Update (Own Profile)",
        roles: ["User"],
        condition: "Users can view and update their own loyalty profile",
        sql: "email = auth.current_user_email()"
      }
    ]
  },
  {
    icon: Lock,
    title: "3. Financial Data Entities",
    description: "Payment methods, bank transactions, and vendor payments",
    rules: [
      {
        operation: "Read (Payment Methods)",
        roles: ["Admin"],
        condition: "Only admins can view all payment methods",
        sql: "role = 'admin'"
      },
      {
        operation: "Read (Own Payment Methods)",
        roles: ["User"],
        condition: "Users can only view their own linked payment methods",
        sql: "user_email = auth.current_user_email()"
      },
      {
        operation: "Create/Update/Delete (Payment Methods)",
        roles: ["Admin"],
        condition: "Only admins can manage payment methods",
        sql: "role = 'admin'"
      },
      {
        operation: "Read (Bank Transactions)",
        roles: ["Admin"],
        condition: "Only admins can view bank transaction data",
        sql: "role = 'admin'"
      },
      {
        operation: "Read (Vendor Payments)",
        roles: ["Admin"],
        condition: "Only admins can view vendor payment records",
        sql: "role = 'admin'"
      },
      {
        operation: "Update (Vendor Payments)",
        roles: ["Admin"],
        condition: "Only admins can update payment status",
        sql: "role = 'admin' AND approval_status = 'Approved'"
      }
    ]
  },
  {
    icon: Eye,
    title: "4. Inventory & Menu Data",
    description: "Menu items, inventory, and forecasting data",
    rules: [
      {
        operation: "Read (Menu Items)",
        roles: ["All Users"],
        condition: "Menu items are public for customer viewing",
        sql: "is_published = true OR role IN ('admin', 'staff')"
      },
      {
        operation: "Create/Update/Delete (Menu Items)",
        roles: ["Admin"],
        condition: "Only admins can manage menu items",
        sql: "role = 'admin'"
      },
      {
        operation: "Read (Inventory)",
        roles: ["Admin", "Staff"],
        condition: "Staff can view inventory for operations",
        sql: "role IN ('admin', 'staff')"
      },
      {
        operation: "Update (Inventory)",
        roles: ["Admin"],
        condition: "Only admins can modify inventory levels",
        sql: "role = 'admin'"
      },
      {
        operation: "Read (Forecasts)",
        roles: ["Admin", "Staff"],
        condition: "AI forecasts visible to operations staff",
        sql: "role IN ('admin', 'staff')"
      }
    ]
  },
  {
    icon: Shield,
    title: "5. Staff & Scheduling Data",
    description: "Staff profiles, shifts, and swap requests",
    rules: [
      {
        operation: "Read (Staff Profiles)",
        roles: ["Admin", "Staff"],
        condition: "Staff can view team roster",
        sql: "role IN ('admin', 'staff')"
      },
      {
        operation: "Create/Update/Delete (Staff)",
        roles: ["Admin"],
        condition: "Only admins can manage staff records",
        sql: "role = 'admin'"
      },
      {
        operation: "Read (Shifts)",
        roles: ["Admin", "Staff"],
        condition: "Staff can view all shifts for scheduling",
        sql: "role IN ('admin', 'staff')"
      },
      {
        operation: "Read (Own Shifts)",
        roles: ["Staff"],
        condition: "Staff can view their own assigned shifts",
        sql: "assigned_staff_email = auth.current_user_email()"
      },
      {
        operation: "Update (Shifts)",
        roles: ["Admin"],
        condition: "Only admins can modify shift assignments",
        sql: "role = 'admin'"
      },
      {
        operation: "Create (Swap Requests)",
        roles: ["Staff"],
        condition: "Staff can request shift swaps",
        sql: "role = 'staff' AND requester_staff_id = auth.current_user_id()"
      },
      {
        operation: "Read (Swap Requests)",
        roles: ["Admin", "Staff"],
        condition: "Staff can view swap requests involving them",
        sql: "role = 'admin' OR requester_staff_id = auth.current_user_id() OR target_staff_id = auth.current_user_id()"
      },
      {
        operation: "Update (Swap Requests)",
        roles: ["Admin"],
        condition: "Only admins can approve/deny swaps",
        sql: "role = 'admin'"
      }
    ]
  },
  {
    icon: Database,
    title: "6. Marketing & Communications",
    description: "Subscribers, reviews, and feedback",
    rules: [
      {
        operation: "Read (Subscribers)",
        roles: ["Admin"],
        condition: "Only admins can view subscriber list",
        sql: "role = 'admin'"
      },
      {
        operation: "Create (Subscribe)",
        roles: ["All Users"],
        condition: "Anyone can subscribe to newsletter",
        sql: "true"
      },
      {
        operation: "Delete (Unsubscribe)",
        roles: ["All Users"],
        condition: "Users can unsubscribe using their email",
        sql: "email = auth.current_user_email() OR email = request_email"
      },
      {
        operation: "Read (Reviews)",
        roles: ["All Users"],
        condition: "Published reviews are public",
        sql: "is_published = true OR role = 'admin'"
      },
      {
        operation: "Create (Reviews)",
        roles: ["All Users"],
        condition: "Authenticated users can submit reviews",
        sql: "auth.is_authenticated()"
      },
      {
        operation: "Update/Delete (Reviews)",
        roles: ["Admin"],
        condition: "Only admins can moderate reviews",
        sql: "role = 'admin'"
      },
      {
        operation: "Read (Support Tickets)",
        roles: ["Admin"],
        condition: "Only admins can view support tickets",
        sql: "role = 'admin'"
      },
      {
        operation: "Read (Own Tickets)",
        roles: ["User"],
        condition: "Users can view their own tickets",
        sql: "email = auth.current_user_email()"
      },
      {
        operation: "Create (Tickets)",
        roles: ["All Users"],
        condition: "Authenticated users can create tickets",
        sql: "auth.is_authenticated()"
      }
    ]
  },
  {
    icon: Lock,
    title: "7. Audit & System Logs",
    description: "Audit logs and system tracking data",
    rules: [
      {
        operation: "Read (Audit Logs)",
        roles: ["Admin"],
        condition: "Only admins can view audit trails",
        sql: "role = 'admin'"
      },
      {
        operation: "Create (Audit Logs)",
        roles: ["System"],
        condition: "System-generated only, no manual creation",
        sql: "false"
      },
      {
        operation: "Update/Delete (Audit Logs)",
        roles: ["None"],
        condition: "Audit logs are immutable",
        sql: "false"
      }
    ]
  },
  {
    icon: Database,
    title: "8. Events & Gift Cards",
    description: "Event bookings, waitlists, and gift card management",
    rules: [
      {
        operation: "Read (Events)",
        roles: ["All Users"],
        condition: "Published events are public",
        sql: "is_published = true OR role IN ('admin', 'staff')"
      },
      {
        operation: "Create/Update/Delete (Events)",
        roles: ["Admin"],
        condition: "Only admins can manage events",
        sql: "role = 'admin'"
      },
      {
        operation: "Read (Event Waitlist)",
        roles: ["Admin", "Staff"],
        condition: "Staff can view waitlist for operations",
        sql: "role IN ('admin', 'staff')"
      },
      {
        operation: "Create (Waitlist)",
        roles: ["All Users"],
        condition: "Anyone can join event waitlist",
        sql: "true"
      },
      {
        operation: "Read (Gift Cards)",
        roles: ["Admin"],
        condition: "Only admins can view all gift cards",
        sql: "role = 'admin'"
      },
      {
        operation: "Read (Own Gift Cards)",
        roles: ["User"],
        condition: "Users can view their purchased gift cards",
        sql: "purchaser_email = auth.current_user_email()"
      },
      {
        operation: "Create (Gift Cards)",
        roles: ["All Users"],
        condition: "Authenticated users can purchase gift cards",
        sql: "auth.is_authenticated()"
      },
      {
        operation: "Update (Gift Cards)",
        roles: ["Admin"],
        condition: "Only admins can modify gift card records",
        sql: "role = 'admin'"
      }
    ]
  }
];

const ROLE_HIERARCHY = [
  { role: "Admin", level: 1, color: "text-red-600", access: "Full system access" },
  { role: "Staff", level: 2, color: "text-blue-600", access: "Operational access" },
  { role: "User", level: 3, color: "text-green-600", access: "Customer access" },
  { role: "Public", level: 4, color: "text-gray-600", access: "Public content only" }
];

function RoleBadge({ role }) {
  const roleData = ROLE_HIERARCHY.find(r => r.role === role);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      role === 'Admin' ? 'bg-red-100 text-red-800' :
      role === 'Staff' ? 'bg-blue-100 text-blue-800' :
      role === 'User' ? 'bg-green-100 text-green-800' :
      'bg-gray-100 text-gray-800'
    }`}>
      {role}
    </span>
  );
}

function RuleRow({ rule, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="grid grid-cols-12 gap-4 py-3 border-b border-border last:border-0"
    >
      <div className="col-span-3 font-body text-sm font-medium text-foreground">
        {rule.operation}
      </div>
      <div className="col-span-3 flex flex-wrap gap-1">
        {rule.roles.map((role, i) => (
          <RoleBadge key={i} role={role} />
        ))}
      </div>
      <div className="col-span-4 font-body text-sm text-muted-foreground">
        {rule.condition}
      </div>
      <div className="col-span-2">
        <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground font-mono">
          {rule.sql}
        </code>
      </div>
    </motion.div>
  );
}

function CategorySection({ category, index }) {
  const Icon = category.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      <div className="bg-muted/50 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">
              {category.title}
            </h2>
            <p className="font-body text-sm text-muted-foreground">
              {category.description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 pb-2 mb-2">
          <div className="col-span-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Operation
          </div>
          <div className="col-span-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Allowed Roles
          </div>
          <div className="col-span-4 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Condition
          </div>
          <div className="col-span-2 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            SQL Policy
          </div>
        </div>

        {/* Rules */}
        <div>
          {category.rules.map((rule, index) => (
            <RuleRow key={index} rule={rule} index={index} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function RLSPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-foreground text-background py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Row-Level Security Policy
          </h1>
          <p className="font-body text-background/70 text-lg max-w-2xl mx-auto">
            Database access control rules and permission matrix for all data entities.
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Role Hierarchy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-8"
        >
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            Role Hierarchy & Access Levels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLE_HIERARCHY.map((role, index) => (
              <motion.div
                key={role.role}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-muted/50 rounded-xl p-4 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-heading font-bold ${role.color}`}>
                    {role.role}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Level {role.level}
                  </span>
                </div>
                <p className="font-body text-sm text-muted-foreground">
                  {role.access}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* RLS Categories */}
        {RLS_CATEGORIES.map((category, index) => (
          <CategorySection key={index} category={category} index={index} />
        ))}

        {/* Implementation Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-primary/5 border border-primary/20 rounded-2xl p-8"
        >
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Lock className="w-6 h-6 text-primary" />
            Implementation Guidelines
          </h2>
          <div className="space-y-4 font-body text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong className="text-foreground">Authentication Required:</strong> All RLS policies assume the user is authenticated. Public routes must explicitly bypass authentication checks.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong className="text-foreground">Email-Based Verification:</strong> User ownership is determined by matching the authenticated user's email with the record's email field.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong className="text-foreground">Role Inheritance:</strong> Higher roles automatically inherit permissions from lower roles unless explicitly restricted.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong className="text-foreground">Audit Trail:</strong> All data access and modifications are logged in the AuditLog entity for compliance and security monitoring.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong className="text-foreground">No Direct Database Access:</strong> All queries must go through the Base44 SDK, which enforces RLS policies automatically.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-8 text-center"
        >
          <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
            Questions About Access Control?
          </h2>
          <p className="font-body text-muted-foreground mb-6">
            Contact our security team for clarification on RLS policies or to request access changes:
          </p>
          <a
            href="mailto:security@jtapkitchen.com"
            className="text-primary hover:underline font-medium"
          >
            security@jtapkitchen.com
          </a>
        </motion.div>
      </div>
    </div>
  );
}