#!/usr/bin/env python3
"""
Database Migration Script for Vibe Musics Backend

Usage:
    python migrate.py "Add new field to User model"
    python migrate.py --upgrade
    python migrate.py --downgrade
    python migrate.py --status
    python migrate.py --help
"""

import sys
import os
from main import create_app
from flask_migrate import migrate, upgrade, downgrade, current, show

# Create app instance
app = create_app()

def print_usage():
    """Print usage instructions"""
    print("=" * 50)
    print("Usage:")
    print("  python migrate.py \"Migration message\"     - Create and run new migration")
    print("  python migrate.py --upgrade               - Apply all pending migrations")
    print("  python migrate.py --downgrade             - Downgrade by one migration")
    print("  python migrate.py --status                - Show current migration status")
    print("  python migrate.py --help                  - Show this help message")
    print("")
    print("Examples:")
    print("  python migrate.py \"Add account_type field to User model\"")
    print("  python migrate.py \"Create Song and Playlist models\"")

def get_migration_status():
    """Get current migration status"""
    try:
        with app.app_context():
            current_rev = current()
            if current_rev:
                print(f"📍 Current migration: {current_rev}")
                return current_rev
            else:
                print("📍 No migrations applied yet")
                return None
    except Exception as e:
        print(f"❌ Error getting migration status: {e}")
        return None

def create_and_run_migration(message):
    """Create a new migration and apply it"""
    try:
        print(f"🔄 Creating migration: {message}")
        
        with app.app_context():
            # Create migration
            migrate(message=message)
            print("✅ Migration file created successfully!")
            
            # Apply migration
            print("🔄 Applying migration...")
            upgrade()
            print("✅ Migration applied successfully!")
            
            # Show final status
            print("\n📊 Final Status:")
            get_migration_status()
            
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        sys.exit(1)

def run_upgrade():
    """Apply all pending migrations"""
    try:
        print("🔄 Applying all pending migrations...")
        
        with app.app_context():
            upgrade()
            print("✅ All migrations applied successfully!")
            
            # Show final status
            print("\n📊 Final Status:")
            get_migration_status()
            
    except Exception as e:
        print(f"❌ Error during upgrade: {e}")
        sys.exit(1)

def run_downgrade():
    """Downgrade by one migration"""
    try:
        print("🔄 Downgrading by one migration...")
        
        with app.app_context():
            downgrade()
            print("✅ Downgrade completed successfully!")
            
            # Show final status
            print("\n📊 Final Status:")
            get_migration_status()
            
    except Exception as e:
        print(f"❌ Error during downgrade: {e}")
        sys.exit(1)

def show_status():
    """Show current migration status and history"""
    try:
        print("📊 Migration Status:")
        print("-" * 30)
        
        with app.app_context():
            # Current migration
            get_migration_status()
            
            # Show migration history
            print("\n📜 Migration History:")
            try:
                show()
            except:
                print("No migration history available")
                
    except Exception as e:
        print(f"❌ Error showing status: {e}")
        sys.exit(1)

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)
    
    arg = sys.argv[1].lower()
    
    print("🎵 Vibe Musics Migration Tool")
    print("=" * 40)
    
    if arg in ['--help', '-h', 'help']:
        print_usage()
    elif arg in ['--status', '-s', 'status']:
        show_status()
    elif arg in ['--upgrade', '-u', 'upgrade']:
        run_upgrade()
    elif arg in ['--downgrade', '-d', 'downgrade']:
        run_downgrade()
    else:
        # Treat as migration message
        migration_message = sys.argv[1]
        if not migration_message.strip():
            print("❌ Migration message cannot be empty!")
            print_usage()
            sys.exit(1)
        
        create_and_run_migration(migration_message)

if __name__ == '__main__':
    main()
