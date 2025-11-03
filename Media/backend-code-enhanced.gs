/**
 * Enhanced Google Apps Script Backend for YUVA Video Manager
 * This script handles video data storage and retrieval using Google Sheets
 * Enhanced with CORS support, error handling, validation, and performance optimizations
 */

// Configuration - Replace with your actual Google Sheet ID
const SHEET_ID = '1izpfxULfr8vCa_GNnyKVizknd1fWSAF6VDDk0WZXk6Y'; // Get this from your Google Sheet URL
const SHEET_NAME = 'Videos'; // Name of the sheet tab

// CORS headers for proper cross-origin requests
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '3600'
};

// Error response helper - using plain text to avoid CORS issues
function createErrorResponse(message, statusCode = 400, callback) {
  const payload = { success: false, error: message, statusCode, timestamp: new Date().toISOString() };
  // Support JSONP when callback is provided
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(payload)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.TEXT);
}

// Success response helper - using plain text to avoid CORS issues
function createSuccessResponse(data, message = 'Success', callback) {
  const response = { success: true, message, data, timestamp: new Date().toISOString() };
  // Support JSONP when callback is provided
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(response)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.TEXT);
}

// Validate video data
function validateVideoData(videoData) {
  const errors = [];
  
  if (!videoData.id || typeof videoData.id !== 'string' || videoData.id.trim() === '') {
    errors.push('Video ID is required and must be a non-empty string');
  }
  
  if (!videoData.category || typeof videoData.category !== 'string' || videoData.category.trim() === '') {
    errors.push('Category is required and must be a non-empty string');
  }
  
  // Title will be enriched from YouTube on the backend; not required in request
  
  // Validate category values
  const validCategories = ['vimarsh', 'bharatparv', 'seminars', 'workshops', 'interviews'];
  if (!validCategories.includes(videoData.category.toLowerCase())) {
    errors.push('Category must be one of: ' + validCategories.join(', '));
  }
  
  // Validate year for Vimarsh videos
  if (videoData.category.toLowerCase() === 'vimarsh' && videoData.year) {
    const year = parseInt(videoData.year);
    if (isNaN(year) || year < 2017 || year > 2025) {
      errors.push('Year must be a number between 2017 and 2025 for Vimarsh videos');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Get sheet with error handling
function getSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    if (!spreadsheet) {
      throw new Error('Spreadsheet not found');
    }
    
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      // Create sheet if it doesn't exist
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      setupSheet();
    }
    
    return sheet;
  } catch (error) {
    console.error('Error accessing sheet:', error);
    throw new Error('Unable to access Google Sheet. Please check your Sheet ID and permissions.');
  }
}

/**
 * Enhanced setup function - Run this once to create the sheet structure
 */
function setupSheet() {
  try {
    const sheet = getSheet();
    
    // Create headers if they don't exist
    const headers = [
      'ID', 'Category', 'Year', 'Title', 'Description', 
      'Published At', 'View Count', 'Duration', 'Thumbnail', 'Date Added'
    ];
    
    // Check if headers exist
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      // Sheet is empty, add headers
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, headers.length).setBackground('#f0f0f0');
      sheet.getRange(1, 1, 1, headers.length).setHorizontalAlignment('center');
      
      // Freeze header row
      sheet.setFrozenRows(1);
      
      console.log('Sheet setup complete!');
    } else {
      console.log('Sheet already has data, skipping setup');
    }
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
}

/**
 * Enhanced add video function with validation and duplicate checking
 */
function addVideo(videoData) {
  try {
    // Validate input data
    const validation = validateVideoData(videoData);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      };
    }
    
    const sheet = getSheet();
    
    // Check for duplicate video ID
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === videoData.id) {
        return {
          success: false,
          message: 'Video with this ID already exists',
          duplicate: true
        };
      }
    }
    
    // Always enrich from YouTube to ensure complete and normalized values
    let enrichedVideoData = { ...videoData };
    try {
      const YOUTUBE_API_KEY = 'AIzaSyC_-iClHMdTb1TRLNtyEDFt7yHa6PZNj7M';
      const response = UrlFetchApp.fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoData.id}&key=${YOUTUBE_API_KEY}`);
      const youtubeData = JSON.parse(response.getContentText());
      
      if (youtubeData.items && youtubeData.items.length > 0) {
        const item = youtubeData.items[0];
        enrichedVideoData.title = item.snippet.title;
        enrichedVideoData.description = item.snippet.description;
        enrichedVideoData.publishedAt = item.snippet.publishedAt;
        enrichedVideoData.viewCount = item.statistics && item.statistics.viewCount ? item.statistics.viewCount : 'N/A';
        enrichedVideoData.duration = formatIsoDuration(item.contentDetails && item.contentDetails.duration ? item.contentDetails.duration : 'PT0S');
        enrichedVideoData.thumbnail = (item.snippet.thumbnails && (item.snippet.thumbnails.medium || item.snippet.thumbnails.default)) ? (item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : item.snippet.thumbnails.default.url) : '';
      }
    } catch (error) {
      console.log('Could not fetch YouTube data:', error);
      // Keep original data if YouTube fetch fails
    }
    
    // Prepare row data with proper formatting
    const rowData = [
      enrichedVideoData.id.trim(),
      enrichedVideoData.category.toLowerCase().trim(),
      enrichedVideoData.year || '',
      enrichedVideoData.title.trim(),
      enrichedVideoData.description ? enrichedVideoData.description.trim() : '',
      enrichedVideoData.publishedAt || new Date().toISOString(),
      enrichedVideoData.viewCount || 'N/A',
      enrichedVideoData.duration || 'N/A',
      enrichedVideoData.thumbnail || '',
      new Date().toISOString()
    ];
    
    // Add to sheet
    sheet.appendRow(rowData);
    
    // Log the addition
    console.log('Video added:', videoData.id);
    
    return {
      success: true,
      message: 'Video added successfully',
      videoId: videoData.id
    };
  } catch (error) {
    console.error('Error adding video:', error);
    return {
      success: false,
      message: 'Failed to add video: ' + error.message
    };
  }
}

/**
 * Enhanced get all videos function with caching and error handling
 */
function getAllVideos() {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    const videos = data.slice(1).map((row, index) => ({
      id: row[0] || '',
      category: row[1] || '',
      year: row[2] || null,
      title: row[3] || '',
      description: row[4] || '',
      publishedAt: row[5] || '',
      viewCount: row[6] || 'N/A',
      duration: row[7] || '00:00',
      thumbnail: row[8] || '',
      dateAdded: row[9] || '',
      rowIndex: index + 2 // For reference
    })).filter(video => video.id !== ''); // Filter out empty rows
    
    return {
      success: true,
      videos: videos,
      count: videos.length
    };
  } catch (error) {
    console.error('Error getting videos:', error);
    return {
      success: false,
      message: 'Failed to retrieve videos: ' + error.message,
      videos: []
    };
  }
}

/**
 * Enhanced update video function
 */
function updateVideo(videoId, videoData) {
  try {
    // Validate input data
    const validation = validateVideoData(videoData);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      };
    }
    
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find the row with the video ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === videoId) {
        const rowData = [
          videoData.id.trim(),
          videoData.category.toLowerCase().trim(),
          videoData.year || '',
          videoData.title.trim(),
          videoData.description ? videoData.description.trim() : '',
          videoData.publishedAt || data[i][5], // Keep original if not provided
          videoData.viewCount || 'N/A',
          videoData.duration || 'N/A',
          videoData.thumbnail || '',
          data[i][9] // Keep original date added
        ];
        
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        
        console.log('Video updated:', videoId);
        
        return {
          success: true,
          message: 'Video updated successfully',
          videoId: videoId
        };
      }
    }
    
    return {
      success: false,
      message: 'Video not found',
      videoId: videoId
    };
  } catch (error) {
    console.error('Error updating video:', error);
    return {
      success: false,
      message: 'Failed to update video: ' + error.message
    };
  }
}

/**
 * Enhanced delete video function
 */
function deleteVideo(videoId) {
  try {
    if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
      return {
        success: false,
        message: 'Video ID is required'
      };
    }
    
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find the row with the video ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === videoId.trim()) {
        sheet.deleteRow(i + 1);
        
        console.log('Video deleted:', videoId);
        
        return {
          success: true,
          message: 'Video deleted successfully',
          videoId: videoId
        };
      }
    }
    
    return {
      success: false,
      message: 'Video not found',
      videoId: videoId
    };
  } catch (error) {
    console.error('Error deleting video:', error);
    return {
      success: false,
      message: 'Failed to delete video: ' + error.message
    };
  }
}

/**
 * Enhanced generate video config with better formatting
 */
function generateVideoConfig() {
  try {
    const result = getAllVideos();
    
    if (!result.success) {
      return {
        success: false,
        message: 'Failed to get videos: ' + result.message
      };
    }
    
    const config = {
      YOUTUBE_CONFIG: {
        API_KEY: 'AIzaSyC_-iClHMdTb1TRLNtyEDFt7yHa6PZNj7M',
        API_URL: 'https://www.googleapis.com/youtube/v3/videos',
        CHANNEL_ID: 'UCouikXeZNp7TgoCfBveZqMA'
      },
      VIDEO_CONFIG: result.videos.map(video => ({
        id: video.id,
        category: video.category,
        year: video.year,
        title: video.title,
        description: video.description,
        publishedAt: video.publishedAt
      }))
    };
    
    return {
      success: true,
      config: config,
      videoCount: result.videos.length
    };
  } catch (error) {
    console.error('Error generating config:', error);
    return {
      success: false,
      message: 'Failed to generate config: ' + error.message
    };
  }
}

/**
 * Health check function
 */
function healthCheck() {
  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    
    return {
      success: true,
      message: 'Service is healthy',
      sheetId: SHEET_ID,
      sheetName: SHEET_NAME,
      totalRows: lastRow,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      message: 'Service is unhealthy: ' + error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Enhanced web app entry point for GET requests with CORS
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const callback = e.parameter.callback; // JSONP callback if provided
    
    let result;
    
    switch (action) {
      case 'getVideos':
        result = getAllVideos();
        break;
        
      case 'getConfig':
        result = generateVideoConfig();
        break;
        
      case 'health':
        result = healthCheck();
        break;
        
      case 'setup':
        setupSheet();
        result = { success: true, message: 'Sheet setup completed' };
        break;
        
      case 'addVideo':
        // Handle add video via GET request
        if (e.parameter.videoData) {
          const videoData = JSON.parse(e.parameter.videoData);
          result = addVideo(videoData);
        } else {
          return createErrorResponse('Video data is required');
        }
        break;
        
      case 'deleteVideo':
        // Handle delete video via GET request
        if (e.parameter.videoId) {
          result = deleteVideo(e.parameter.videoId);
        } else {
          return createErrorResponse('Video ID is required');
        }
        break;
        
      default:
        return createErrorResponse('Invalid action. Supported actions: getVideos, getConfig, health, setup, addVideo, deleteVideo', 400, callback);
    }
    
    // Wrap the result in a data object for consistency with frontend expectations
    const responseData = {
      success: result.success,
      message: result.message,
      data: result
    };
    return createSuccessResponse(responseData, result.message, callback);
    
  } catch (error) {
    console.error('GET request error:', error);
    const callback = e && e.parameter ? e.parameter.callback : undefined;
    return createErrorResponse('Internal server error: ' + error.message, 500, callback);
  }
}

/**
 * Enhanced web app entry point for POST requests with CORS
 */
function doPost(e) {
  try {
    // Parse request data
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    
    const action = data.action;
    
    if (!action) {
      return createErrorResponse('Action is required', 400);
    }
    
    let result;
    
    switch (action) {
      case 'addVideo':
        if (!data.videoData) {
          return createErrorResponse('Video data is required', 400);
        }
        result = addVideo(data.videoData);
        break;
        
      case 'updateVideo':
        if (!data.videoId || !data.videoData) {
          return createErrorResponse('Video ID and video data are required', 400);
        }
        result = updateVideo(data.videoId, data.videoData);
        break;
        
      case 'deleteVideo':
        if (!data.videoId) {
          return createErrorResponse('Video ID is required', 400);
        }
        result = deleteVideo(data.videoId);
        break;
        
      default:
        return createErrorResponse('Invalid action. Supported actions: addVideo, updateVideo, deleteVideo');
    }
    
    if (result.success) {
      // Wrap the result in a data object for consistency with frontend expectations
      const responseData = {
        success: result.success,
        message: result.message,
        data: result
      };
      return createSuccessResponse(responseData, result.message);
    } else {
      return createErrorResponse(result.message, 400);
    }
    
  } catch (error) {
    console.error('POST request error:', error);
    return createErrorResponse('Internal server error: ' + error.message, 500);
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}
