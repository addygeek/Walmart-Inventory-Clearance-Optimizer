# config.py
import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-change-in-production'
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb+srv://username:password@cluster0.mongodb.net/walmart_clearance?retryWrites=true&w=majority'
    JWT_EXPIRATION_DELTA = timedelta(hours=24)
    
class DevelopmentConfig(Config):
    DEBUG = True
    
class ProductionConfig(Config):
    DEBUG = False
    
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
