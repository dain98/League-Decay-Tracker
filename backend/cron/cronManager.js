import cron from 'node-cron';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
  : 'http://localhost:5000';
const API_KEY = process.env.DECAY_API_KEY;

class CronManager {
    constructor() {
        this.decayJobs = [];
        this.matchHistoryJob = null;
    }

    // Start all cron jobs
    start() {
        console.log('Starting cron jobs...');
        
        // Daily decay processing at 00:00 UTC
        this.startDecayJob();
        
        // Match history checking every 30 minutes
        this.startMatchHistoryJob();
        
        console.log('Cron jobs started successfully');
    }

    // Stop all cron jobs
    stop() {
        if (this.decayJobs.length > 0) {
            this.decayJobs.forEach(({ region, job }) => {
                job.stop();
                console.log(`Decay job for ${region} stopped`);
            });
        }
        
        if (this.matchHistoryJob) {
            this.matchHistoryJob.stop();
            console.log('Match history job stopped');
        }
    }

    // Start the daily decay processing jobs for each region
    startDecayJob() {
        // Define region-specific decay schedules
        const regionSchedules = [
            { region: 'na1', timezone: 'America/Los_Angeles', schedule: '39 0 * * *' },
            { region: 'kr', timezone: 'Asia/Seoul', schedule: '39 0 * * *' },
            { region: 'euw1', timezone: 'Europe/London', schedule: '39 0 * * *' }
        ];

        // Create separate cron jobs for each region
        this.decayJobs = regionSchedules.map(({ region, timezone, schedule }) => {
            const job = cron.schedule(schedule, async () => {
                console.log(`Running daily decay processing for ${region} at 12:39 AM ${timezone}...`);
                try {
                    await this.processDecayForRegion(region);
                    console.log(`Daily decay processing for ${region} completed successfully`);
                } catch (error) {
                    console.error(`Error in daily decay processing for ${region}:`, error.message);
                }
            }, {
                scheduled: true,
                timezone: timezone
            });
            
            console.log(`Decay job scheduled for ${region} at 00:39 ${timezone} daily`);
            return { region, job };
        });
    }

    // Start the match history checking job
    startMatchHistoryJob() {
        // Run every hour
        this.matchHistoryJob = cron.schedule('0 * * * *', async () => {
            console.log('Running match history check...');
            try {
                await this.processMatchHistory();
                console.log('Match history check completed successfully');
            } catch (error) {
                console.error('Error in match history check:', error.message);
            }
        }, {
            scheduled: true,
            timezone: "UTC"
        });
        
        console.log('Match history job scheduled for every hour');
    }

    // Process decay for a specific region
    async processDecayForRegion(region) {
        try {
            console.log(`Processing decay for region: ${region}`);
            
            const response = await axios.post(`${API_BASE_URL}/api/accounts/decay/process`, {
                region: region
            }, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`Decay processing for ${region}:`, response.data.message);
        } catch (error) {
            console.error(`Error processing decay for ${region}:`, error.response?.data?.message || error.message);
        }
    }

    // Process decay for all regions (for manual triggers)
    async processDecay() {
        const regions = ['na1', 'euw1', 'eun1', 'kr', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru', 'jp1'];
        
        for (const region of regions) {
            await this.processDecayForRegion(region);
        }
    }

    // Process match history for all accounts
    async processMatchHistory() {
        try {
            console.log('Processing match history for all accounts...');
            console.log(`Using API URL: ${API_BASE_URL}`);
            
            const response = await axios.post(`${API_BASE_URL}/api/accounts/decay/check-matches`, {}, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Match history processing completed:', response.data.message);
        } catch (error) {
            console.error('Error processing match history:', error.response?.data?.message || error.message);
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                console.error(`Network error - check if API_BASE_URL is correct: ${API_BASE_URL}`);
            }
        }
    }

    // Manual trigger for testing
    async triggerDecay() {
        console.log('Manually triggering decay processing...');
        await this.processDecay();
    }

    async triggerMatchHistory() {
        console.log('Manually triggering match history check...');
        await this.processMatchHistory();
    }
}

export default CronManager; 
