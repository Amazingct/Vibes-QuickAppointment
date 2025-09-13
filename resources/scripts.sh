# Create a new conda environment named 'vcp'
conda create -n vcp python=3.11.3 -y

# Activate the conda environment
conda activate vcp

# Install Vite globally using npm
npm install -g vite

# Install project dependencies from requirements.txt
pip install -r requirements.txt

# Initialize a new Vite project (assuming a JavaScript setup)
vite create [project name]

# Install additional npm packages if needed
npm install

# Start the Vite development server
npm run dev

# Kill services running on port 5002 (backend)
# Use this if backend port is occupied
kill -9 $(lsof -ti:5002)

# Alternative command to kill services on port 5002
# lsof -ti:5002 | xargs kill -9

# Kill services running on port 5173 (frontend Vite)
# Use this if frontend port is occupied
kill -9 $(lsof -ti:5173)


#spin up database
cd backend/docs
docker-compose down
docker-compose up -d