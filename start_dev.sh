#!/bin/bash

# VCP Full Stack Development Startup Script
# This script manages both backend and frontend development servers with proper process cleanup

set -e  # Exit on any error

echo "🚀 VCP Full Stack Development Startup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to kill processes on specific ports
kill_port_processes() {
    local port=$1
    local service_name=$2
    
    print_status "Cleaning up existing $service_name processes on port $port..."
    
    if lsof -ti:$port >/dev/null 2>&1; then
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
        print_success "$service_name processes killed successfully"
    else
        print_status "No existing $service_name processes found on port $port"
    fi
}

# Function to check if conda environment exists
check_conda_env() {
    if conda env list | grep -q "^vcp "; then
        print_success "Conda environment 'vcp' found"
        return 0
    else
        print_error "Conda environment 'vcp' not found"
        print_status "Creating conda environment 'vcp'..."
        conda create -n vcp python=3.11.3 -y
        print_success "Conda environment 'vcp' created"
        return 0
    fi
}

# Function to start backend
start_backend() {
    print_status "Starting backend server..."
    
    # Kill existing backend processes
    kill_port_processes 5002 "backend"
    
    # Check conda environment
    check_conda_env
    
    # Navigate to backend directory
    cd backend || {
        print_error "Backend directory not found"
        exit 1
    }
    
    # Activate conda environment and start server in background
    print_status "Activating conda environment and starting Flask server..."
    source ~/anaconda3/etc/profile.d/conda.sh
    conda activate vcp
    
    # Start backend in background
    python main.py &
    BACKEND_PID=$!
    
    # Store PID for cleanup
    echo $BACKEND_PID > ../backend.pid
    
    print_success "Backend server started with PID: $BACKEND_PID"
    cd ..
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend development server..."
    
    # Kill existing frontend processes
    kill_port_processes 5173 "frontend"
    
    # Navigate to frontend directory
    cd frontend || {
        print_error "Frontend directory not found"
        exit 1
    }
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend in background
    npm run dev &
    FRONTEND_PID=$!
    
    # Store PID for cleanup
    echo $FRONTEND_PID > ../frontend.pid
    
    print_success "Frontend server started with PID: $FRONTEND_PID"
    cd ..
}

# Function to check if services are running
check_services() {
    print_status "Checking service status..."
    
    # Check backend
    if curl -s http://localhost:5002 >/dev/null 2>&1; then
        print_success "✅ Backend is running on http://localhost:5002"
    else
        print_warning "❌ Backend is not responding on http://localhost:5002"
    fi
    
    # Check frontend (just check if port is in use, since Vite might not respond to curl)
    if lsof -ti:5173 >/dev/null 2>&1; then
        print_success "✅ Frontend is running on http://localhost:5173"
    else
        print_warning "❌ Frontend is not running on http://localhost:5173"
    fi
}

# Function to stop all services
stop_services() {
    print_status "Stopping all development services..."
    
    # Kill processes using stored PIDs
    if [ -f "backend.pid" ]; then
        BACKEND_PID=$(cat backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm -f backend.pid
        print_success "Backend process stopped"
    fi
    
    if [ -f "frontend.pid" ]; then
        FRONTEND_PID=$(cat frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm -f frontend.pid
        print_success "Frontend process stopped"
    fi
    
    # Fallback: kill any remaining processes on the ports
    kill_port_processes 5002 "backend"
    kill_port_processes 5173 "frontend"
    
    print_success "All services stopped"
}

# Function to setup cleanup on script exit
setup_cleanup() {
    trap stop_services EXIT
    trap stop_services INT
    trap stop_services TERM
}

# Main script logic
main() {
    case "${1:-start}" in
        "start")
            setup_cleanup
            
            print_status "Starting VCP development environment..."
            
            # Start backend
            start_backend
            
            # Wait a moment for backend to initialize
            sleep 3
            
            # Start frontend
            start_frontend
            
            # Wait a moment for frontend to initialize
            sleep 3
            
            # Check services
            check_services
            
            print_success "🎉 Development environment is ready!"
            print_status "📖 Backend API: http://localhost:5002"
            print_status "🎨 Frontend App: http://localhost:5173"
            print_status "🛑 Press Ctrl+C to stop all services"
            
            # Keep script running
            wait
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            main start
            ;;
        "status")
            check_services
            ;;
        "clean")
            print_status "Cleaning up all development processes..."
            kill_port_processes 5002 "backend"
            kill_port_processes 5173 "frontend"
            rm -f backend.pid frontend.pid
            print_success "Cleanup completed"
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|status|clean}"
            echo ""
            echo "Commands:"
            echo "  start   - Start both backend and frontend servers (default)"
            echo "  stop    - Stop all development servers"
            echo "  restart - Restart all development servers"
            echo "  status  - Check status of development servers"
            echo "  clean   - Kill all processes and clean up PID files"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
