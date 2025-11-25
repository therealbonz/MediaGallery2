require 'sinatra'
require 'sinatra/json'
require 'sinatra/reloader' if development?
require 'rack/cors'
require 'sequel'
require 'json'
require 'base64'
require 'fileutils'

class MediaGalleryApp < Sinatra::Base
  configure do
    set :port, 3001
    set :bind, '0.0.0.0'
    
    use Rack::Cors do
      allow do
        origins '*'
        resource '*', 
          headers: :any, 
          methods: [:get, :post, :patch, :put, :delete, :options]
      end
    end
    
    DB = Sequel.connect(ENV['DATABASE_URL'])
    
    DB.run <<-SQL
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        url TEXT NOT NULL,
        media_type TEXT NOT NULL,
        liked BOOLEAN NOT NULL DEFAULT false,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    SQL
  end

  before do
    content_type :json
  end

  helpers do
    def json_body
      request.body.rewind
      JSON.parse(request.body.read) rescue {}
    end
  end

  get '/api/media' do
    media = DB[:media].order(:display_order, Sequel.desc(:created_at)).all
    json media.map { |m| transform_keys(m) }
  end

  post '/api/media/upload' do
    content_type :json
    
    unless params[:files]
      halt 400, json(error: 'No files uploaded')
    end

    files = params[:files].is_a?(Array) ? params[:files] : [params[:files]]
    uploaded_media = []

    files.each do |file|
      tempfile = file[:tempfile]
      filename = file[:filename]
      mimetype = file[:type]

      data = Base64.strict_encode64(tempfile.read)
      data_url = "data:#{mimetype};base64,#{data}"
      
      media_type = mimetype.start_with?('image/') ? 'image' : 'video'
      
      max_order = DB[:media].max(:display_order) || 0
      
      id = DB[:media].insert(
        filename: filename,
        url: data_url,
        media_type: media_type,
        liked: false,
        display_order: max_order + 1,
        created_at: Time.now
      )
      
      new_media = DB[:media].where(id: id).first
      uploaded_media << transform_keys(new_media)
    end

    json uploaded_media
  end

  post '/api/media/:id/like' do
    id = params[:id].to_i
    body = json_body
    liked = body['liked']
    
    updated = DB[:media].where(id: id).update(liked: liked)
    
    if updated == 0
      halt 404, json(error: 'Media not found')
    end
    
    media = DB[:media].where(id: id).first
    json transform_keys(media)
  end

  delete '/api/media/:id' do
    id = params[:id].to_i
    
    deleted = DB[:media].where(id: id).delete
    
    if deleted == 0
      halt 404, json(error: 'Media not found')
    end
    
    json(success: true)
  end

  post '/api/media/reorder' do
    body = json_body
    ordered_ids = body['orderedIds']
    
    unless ordered_ids.is_a?(Array)
      halt 400, json(error: 'orderedIds must be an array')
    end
    
    DB.transaction do
      ordered_ids.each_with_index do |id, index|
        DB[:media].where(id: id).update(display_order: index)
      end
    end
    
    json(success: true)
  end

  private

  def transform_keys(hash)
    {
      id: hash[:id],
      filename: hash[:filename],
      url: hash[:url],
      mediaType: hash[:media_type],
      liked: hash[:liked],
      displayOrder: hash[:display_order],
      createdAt: hash[:created_at]&.iso8601
    }
  end
end

if __FILE__ == $0
  MediaGalleryApp.run!
end
