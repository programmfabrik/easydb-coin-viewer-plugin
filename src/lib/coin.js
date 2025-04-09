/** Coin viewer Lib **/
ez5.CoinLib = function() {
	//Constructor:
	function Animation()
	{
	  this.worldTime = 3.14 * 1.5;  //World time in seconds (starts with offset for initial light position at upper left)
	  this.lastTimeStamp = (new Date()).getTime();

	  //Automatic rotation of the light source:
	  this.lightRotationEnabled = true;
	  let scaledTime = 0.5 * this.worldTime;
	  let rx = Math.sin(scaledTime) * 0.85, ry = Math.cos(scaledTime) * 0.85;
	  this.lightVector = new Vector3f(rx, ry, -Math.sqrt(Math.max(0.0, 1.0 - (rx * rx + ry * ry))));

	  //Fixed material color:
	  this.fixedMaterialColor = [-1.0, -1.0, -1.0, 0.0];

	  //Default lighting color and environment reflection:
	  this.lightColor = [1.5, 1.5, 1.5];
	  this.environmentReflectance = 0.1;

	  //Smooth blending of view points:
	  this.viewAlterationEnabled = false;
	  this.viewAlterationTimeInterval = 1.0;  //Use N seconds for the view alteration animation
	  this.viewAlterationTimeStart = (new Date()).getTime();
	  this.viewAlterationTransformation = [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0]; //4x4 Transformation
	  this.viewAlterationTransformationStart = this.viewAlterationTransformation.slice();
	  this.viewAlterationTransformationEnd = this.viewAlterationTransformation.slice();
	  this.viewAlterationLightDirectionStart = [0.57, -0.57, -0.57];
	  this.viewAlterationLightDirectionEnd = this.viewAlterationLightDirectionStart.slice();
	  this.viewAlterationLightColorStart = this.lightColor.slice();
	  this.viewAlterationLightColorEnd = this.viewAlterationLightColorStart.slice();
	  this.viewAlterationEnvironmentReflectanceStart = this.environmentReflectance;
	  this.viewAlterationEnvironmentReflectanceEnd = this.environmentReflectance;
	  this.viewAlterationFixedMaterialColorStart = this.fixedMaterialColor.slice();
	  this.viewAlterationFixedMaterialColorEnd = this.viewAlterationFixedMaterialColorStart.slice();
	  this.viewAlterationFlipHorizontal = false;
	  this.viewAlterationFlipHorizontalPercent = 0.0;  //Turns from 100.0 to 0.0 when flipping object
	  this.viewAlterationFlipVertical = false;
	  this.viewAlterationFlipVerticalPercent = 0.0;  //Turns from 100.0 to 0.0 when flipping object
	  this.viewAlterationScaleGridBlendingFactor = 0.0;
	  this.viewAlterationScaleGridBlendIn = false;
	  this.viewAlterationScaleGridBlendOut = false;
	}

	//Function enables alteration of view point / light / object color / ... :
	Animation.prototype.enableViewAlteration = function(currMatTransform, destinationMatTransform, currLightDir, destinationLightDir, currLightColor, destinationLightColor,
														currEnvironmentReflectance, destinationEnvironmentReflectance, currFixedMaterialColor, destinationFixedMaterialColor)
	{
	  this.viewAlterationEnabled = true;
	  this.viewAlterationTimeStart = (new Date()).getTime();
	  this.viewAlterationTransformationStart = currMatTransform.slice();
	  this.viewAlterationTransformationEnd = destinationMatTransform.slice();
	  this.viewAlterationTransformation = this.viewAlterationTransformationStart.slice();
	  this.lightRotationEnabled = false;
	  this.viewAlterationLightDirectionStart = currLightDir.slice();
	  this.viewAlterationLightDirectionEnd = destinationLightDir.slice();
	  this.viewAlterationLightColorStart = currLightColor.slice();
	  this.viewAlterationLightColorEnd = destinationLightColor.slice();
	  this.viewAlterationEnvironmentReflectanceStart = currEnvironmentReflectance;
	  this.viewAlterationEnvironmentReflectanceEnd = destinationEnvironmentReflectance;
	  this.viewAlterationFixedMaterialColorStart = currFixedMaterialColor.slice();
	  this.viewAlterationFixedMaterialColorEnd = destinationFixedMaterialColor.slice();
	}

	//Function returns true, if animation is currently running and can not be interrupted by user:
	Animation.prototype.isRunningAndNotInterruptible = function()
	{
	  return this.viewAlterationFlipHorizontal || this.viewAlterationFlipVertical || this.viewAlterationScaleGridBlendIn || this.viewAlterationScaleGridBlendOut;
	}

	//Function updates values for animation:
	Animation.prototype.update = function()
	{
	  //Compute time step and new world time:
	  let currTime = (new Date()).getTime();
	  let timeStep = (currTime - this.lastTimeStamp) * 0.001;  //seconds
	  this.worldTime += timeStep;
	  this.lastTimeStamp = currTime;

	  //Rotate light if enabled:
	  if(this.lightRotationEnabled)
	  {
		let scaledTime = 0.5 *  this.worldTime;
		let rx = Math.sin(scaledTime) * 0.85, ry = Math.cos(scaledTime) * 0.85;
		this.lightVector.data[0] = rx;
		this.lightVector.data[1] = ry;
		this.lightVector.data[2] = -Math.sqrt(Math.max(0.0, 1.0 - (rx * rx + ry * ry)));
	  }

	  //Transform view:
	  if(this.viewAlterationEnabled)
	  {
		//Elapsed seconds since alteration start:
		let elapsedSeconds = ((new Date()).getTime() - this.viewAlterationTimeStart) * 0.001;
		let alterationFinished = elapsedSeconds >= this.viewAlterationTimeInterval;
		//Finished:
		if(alterationFinished)
		{
		  this.viewAlterationTransformation = this.viewAlterationTransformationEnd.slice();
		  this.lightVector.data = this.viewAlterationLightDirectionEnd.slice();
		  this.lightColor = [this.viewAlterationLightColorEnd[0], this.viewAlterationLightColorEnd[1], this.viewAlterationLightColorEnd[2]];
		  this.environmentReflectance = this.viewAlterationEnvironmentReflectanceEnd;
		  this.fixedMaterialColor = this.viewAlterationFixedMaterialColorEnd.slice();
		  this.viewAlterationFlipHorizontal = false;
		  this.viewAlterationFlipHorizontalPercent = 0.0;
		  this.viewAlterationFlipVertical = false;
		  this.viewAlterationFlipVerticalPercent = 0.0;
		  if(this.viewAlterationScaleGridBlendIn)
			this.viewAlterationScaleGridBlendingFactor = 1.0;
		  this.viewAlterationScaleGridBlendIn = false;
		  if(this.viewAlterationScaleGridBlendOut)
			this.viewAlterationScaleGridBlendingFactor = 0.0;
		  this.viewAlterationScaleGridBlendOut = false;
		  this.viewAlterationEnabled = false;  //stop interpolation
		}
		//Interpolate transformation, blending, ...:
		else
		{
		  //Compute blend factor:
		  let blendFactor = 1.0 - (elapsedSeconds / this.viewAlterationTimeInterval);
		  blendFactor = (Math.sin((1.0 - blendFactor) * Math.PI + Math.PI / 2.0) + 1.0) * 0.5; //use sinus to have a smooth acceleration and slowdown of the movement
		  let invBlendFactor = 1.0 - blendFactor;  //0.0 -> 1.0
		  //Apply blending:
		  for (let n = 0; n < 16; ++n)
			this.viewAlterationTransformation[n] = blendFactor * this.viewAlterationTransformationStart[n] + invBlendFactor * this.viewAlterationTransformationEnd[n];
		  let lx = blendFactor * this.viewAlterationLightDirectionStart[0] + invBlendFactor * this.viewAlterationLightDirectionEnd[0];
		  let ly = blendFactor * this.viewAlterationLightDirectionStart[1] + invBlendFactor * this.viewAlterationLightDirectionEnd[1];
		  this.lightVector.data = [lx, ly, -Math.sqrt(Math.max(0.0, 1.0 - (lx * lx + ly * ly)))];
		  this.lightColor = [this.viewAlterationLightColorStart[0] * blendFactor + this.viewAlterationLightColorEnd[0] * invBlendFactor,
							 this.viewAlterationLightColorStart[1] * blendFactor + this.viewAlterationLightColorEnd[1] * invBlendFactor,
							 this.viewAlterationLightColorStart[2] * blendFactor + this.viewAlterationLightColorEnd[2] * invBlendFactor];
		  this.environmentReflectance = this.viewAlterationEnvironmentReflectanceStart * blendFactor + this.viewAlterationEnvironmentReflectanceEnd * invBlendFactor;
		  this.fixedMaterialColor = [ this.viewAlterationFixedMaterialColorStart[0] * blendFactor + this.viewAlterationFixedMaterialColorEnd[0] * invBlendFactor,
									  this.viewAlterationFixedMaterialColorStart[1] * blendFactor + this.viewAlterationFixedMaterialColorEnd[1] * invBlendFactor,
									  this.viewAlterationFixedMaterialColorStart[2] * blendFactor + this.viewAlterationFixedMaterialColorEnd[2] * invBlendFactor,
									  this.viewAlterationFixedMaterialColorStart[3] * blendFactor + this.viewAlterationFixedMaterialColorEnd[3] * invBlendFactor ];
		  //Compute flip percentage:
		  if(this.viewAlterationFlipHorizontal)
			this.viewAlterationFlipHorizontalPercent = 100.0 - 100.0 * Math.sin(Math.PI * 0.5 * (elapsedSeconds / this.viewAlterationTimeInterval)); //use sinus for smooth acceleration/slowdown
		  if(this.viewAlterationFlipVertical)
			this.viewAlterationFlipVerticalPercent = 100.0 - 100.0 * Math.sin(Math.PI * 0.5 * (elapsedSeconds / this.viewAlterationTimeInterval));
		  //Blending of scale grid:
		  if(this.viewAlterationScaleGridBlendIn)
			this.viewAlterationScaleGridBlendingFactor = elapsedSeconds / this.viewAlterationTimeInterval;
		  if(this.viewAlterationScaleGridBlendOut)
			this.viewAlterationScaleGridBlendingFactor = 1.0 - Math.max(0.0, elapsedSeconds / this.viewAlterationTimeInterval);
		}     
	  }
	}

	//Constructor:
	function BackgroundMapGenerator()
	{
	}

	//Function processes the generation of the background map (Ratio of background to foreground in local neighborhood for each pixel):
	BackgroundMapGenerator.prototype.computeBackgroundMapData = function(normalImage)
	{
	  let texWidth = normalImage.width, texHeight = normalImage.height;
	  let texData = new Uint8Array(texWidth * texHeight);

	  var canvas = document.createElement('canvas');
	  canvas.width = texWidth;
	  canvas.height = texHeight;
	  var context = canvas.getContext('2d');
	  context.drawImage(normalImage, 0, 0);
	  let imgData = context.getImageData(0, 0, texWidth, texHeight).data;

	  let GAUSS_HSIZE = 2; //same as in shader
	  for(let iy = 0; iy < texHeight; ++iy)
	  {
		for(let ix = 0; ix < texWidth; ++ix)
		{
		  let nBackground = 0.0;
		  let nSamples = 0;
		  for(let gy = -GAUSS_HSIZE; gy <=GAUSS_HSIZE; ++gy)
			for(let gx = -GAUSS_HSIZE; gx <=GAUSS_HSIZE; ++gx)
			{
			  let sampleX = ix + gx;
			  let sampleY = iy + gy;
			  if(sampleX < 0 || sampleY < 0 || sampleX >= texWidth || sampleY >= texHeight)
				nBackground += 1.0;
			  else
			  {
				let index = (sampleY * texWidth + sampleX) * 4;
				if(imgData[index] == 127 && imgData[index + 1] == 127 && imgData[index + 2] == 127)
				  nBackground += 1.0;
			  }
			  nSamples++;
			}
		  texData[iy * texWidth + ix] = Math.round(255.0 * nBackground / nSamples);
		}
	  }

	  return texData;
	}

	//Constructor:
	function GLShader(glContext, shaderType, shaderSource)
	{
	  try
	  {
		//No valid context avail:
		if (!glContext)
		  throw 'GLContext is not present!';
		let gl = glContext;
		//Load shader:
		this.glID = gl.createShader(shaderType);
		gl.shaderSource(this.glID, shaderSource);
		gl.compileShader(this.glID);
		if (!gl.getShaderParameter(this.glID, gl.COMPILE_STATUS))
		{
		  let errMsg = (shaderType == gl.VERTEX_SHADER ? 'Vertex' : 'Fragment') + ' shader (' + shaderSource.length + ' bytes) compilation error: ' +
					   gl.getShaderInfoLog(this.glID);
		  gl.deleteShader(this.glID);  //NOTE: Delete shader AFTER retrieving info log.
		  this.glID = null;
		  throw errMsg;
		}
	  }
	  catch (exception)
	  {
		let errMsg = 'GLShader::GLShader(..): Error: ' + exception;
		throw errMsg;
	  }
	}

	//Constructor:
	function GLProgram(glContext, vertexShaderSource, fragmentShaderSource)
	{
	  try
	  {
		//No valid context avail:
		if (!glContext)
		  throw 'GLContext is not present!';
		this.glContext = glContext;
		let gl = glContext;
		//Load shaders:
		let vertexShader = new GLShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
		let fragmentShader = new GLShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
		//Load shader program:
		this.glID = gl.createProgram();
		gl.attachShader(this.glID, vertexShader.glID);
		gl.attachShader(this.glID, fragmentShader.glID);
		gl.linkProgram(this.glID);
		if (!gl.getProgramParameter(this.glID, gl.LINK_STATUS))
		{
		  this.glID = null;
		  throw ('Shader program error: ' + gl.getProgramInfoLog(this.glID));
		}
	  }
	  catch (exception)
	  {
		let errMsg = 'GLProgram::GLProgram(..): Error: ' + exception;
		throw errMsg;
	  }
	}

	//Function binds program:
	GLProgram.prototype.bind = function ()
	{
	  if (typeof this.glID !== 'undefined' && this.glID)
		this.glContext.useProgram(this.glID);
	}

	//Constructor:
	function GLTexture(glContext, imageWidth, imageHeight, imageData, glTarget, glInternalFormat, glFormat, glTexMinFilter, glTexMagFilter, glWrapS, glWrapT)
	{
	  try
	  {
		//No valid context avail:
		if (!glContext)
		  throw 'GLContext is not present!';
		this.glContext = glContext;
		let gl = glContext;
		//Create texture:
		this.glID = gl.createTexture();
		this.glTarget = glTarget;
		this.glFormat = glFormat;
		gl.bindTexture(this.glTarget, this.glID);
		//Upload data:
		if (glTarget == gl.TEXTURE_2D)
		{
		  gl.texImage2D(this.glTarget, 0, glInternalFormat, imageWidth, imageHeight, 0, glFormat, gl.UNSIGNED_BYTE, imageData);
		}
		else if (glTarget == gl.TEXTURE_CUBE_MAP)
		{
		  let oldAlignment = gl.getParameter(gl.UNPACK_ALIGNMENT);
		  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
		  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, glInternalFormat, imageData[0], imageData[1], 0, glFormat, gl.UNSIGNED_BYTE, imageData[2]);
		  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, glInternalFormat, imageData[0], imageData[1], 0, glFormat, gl.UNSIGNED_BYTE, imageData[3]);
		  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, glInternalFormat, imageData[0], imageData[1], 0, glFormat, gl.UNSIGNED_BYTE, imageData[4]);
		  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, glInternalFormat, imageData[0], imageData[1], 0, glFormat, gl.UNSIGNED_BYTE, imageData[5]);
		  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, glInternalFormat, imageData[0], imageData[1], 0, glFormat, gl.UNSIGNED_BYTE, imageData[6]);
		  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, glInternalFormat, imageData[0], imageData[1], 0, glFormat, gl.UNSIGNED_BYTE, imageData[7]);
		  gl.pixelStorei(gl.UNPACK_ALIGNMENT, oldAlignment);
		}
		else
		  throw 'Value for texture target is not supported!';
		//Set filter parameter:
		gl.texParameteri(this.glTarget, gl.TEXTURE_MIN_FILTER, glTexMinFilter); //NOTE: Mipmaps are not supported for NPOT-Textures
		gl.texParameteri(this.glTarget, gl.TEXTURE_MAG_FILTER, glTexMagFilter);
		gl.texParameteri(this.glTarget, gl.TEXTURE_WRAP_S, glWrapS);
		gl.texParameteri(this.glTarget, gl.TEXTURE_WRAP_T, glWrapT);
	  }
	  catch (exception)
	  {
		this.glID = null;
		let errMsg = 'GLTexture::GLTexture(..): Error: ' + exception;
		throw errMsg;
	  }
	}

	//Function binds texture:
	GLTexture.prototype.bind = function()
	{
	  if (typeof this.glID !== 'undefined' && this.glID)
		this.glContext.bindTexture(this.glTarget, this.glID);
	}

	//Function updates partial part of the texture:
	GLTexture.prototype.updatePartialTexture = function(xOffset, yOffset, image)
	{
	  if (typeof this.glID !== 'undefined' && this.glID)
	  {
		let gl = this.glContext;
		gl.texSubImage2D(this.glTarget, 0, xOffset, yOffset, this.glFormat, gl.UNSIGNED_BYTE, image);
	  }
	}

	//Function updates the texture:
	GLTexture.prototype.updateTextureFromUint8ClampedArray = function(imageWidth, imageHeight, imageUint8ClampedArrayData)
	{
	  if (typeof this.glID !== 'undefined' && this.glID)
	  {
		let gl = this.glContext;
		const imageData = new ImageData(imageUint8ClampedArrayData, imageWidth, imageHeight);
		gl.texSubImage2D(this.glTarget, 0, 0, 0, this.glFormat, gl.UNSIGNED_BYTE, imageData);
	  }
	}

	//Constructor:
	function GLVBO(glContext)
	{
	  try
	  {
		//No valid context avail:
		if (!glContext)
		  throw 'GLContext is not present!';
		this.glContext = glContext;
		let gl = glContext;
		//Create buffer:
		this.glID = gl.createBuffer();
	  }
	  catch (exception)
	  {
		this.glID = null;
		let errMsg = 'GLVBO::GLVBO(..): Error: ' + exception;
		throw errMsg;
	  }
	}

	//Function binds VBO:
	GLVBO.prototype.bind = function()
	{
	  if (typeof this.glID !== 'undefined' && this.glID)
		this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.glID);
	}

	//Function updates buffer data:
	GLVBO.prototype.update = function(data)
	{
	  if (typeof this.glID !== 'undefined' && this.glID)
	  {
		let gl = this.glContext;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.glID);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	  }
	}
	let cubemapNegX = "iaC8iZ+7h566hp25h526h566iZ+7jKK8jqO9kaW/kKS+jKC7iJ66hZu4hpu4ip+6nKzCqLXGm6rAxsvTzM/W4eDh7Oro3d3hmKjBh5u5g5m3gZe1fZWze5SyfZSzfZWziqG8iqC7iJ+6hp65h525hp65iJ+6jaK9kaa/vMXRztPazNLarbnLh526hpy5ip66jaG7k6W9sbvL1NXazdDX5eTk0dTZsrzLiZ66g5m2gZi3f5a1fJSze5OyfZWzfpa0iqG7iqG8iaC7h5+6h566hp66iKC7kaW+sb3M4ePk7e3r7u7r3ODgi6G9hp25iJ66h525j6K8t8DNqrbHnq3CrLfIqbTGiJ26hJq4gZi2f5e2fZW1e5Oye5Szfpa1fpa1iqK8iqK7iqK8iKC7iKC6h5+6iKC7k6e/yc7V7Ozo7Ozp6Ojm1NfbjqO+i6G8jaG8hpy5i6C7ip67g5q4mqrAkKK8hJq3gZm3gpm3gJi2fpe2fZa1fJWzfJa0f5e1f5i1iqK8i6S9iqO8iaK7iKG7iaG8iaC9jKK+m67E1tjd5ubk5ebk4eHhl6rCorHFs73Ln67Dnq7Dm6rBgZi3gZi3f5e1fJW0f5e1gJi3gJi2gJi2f5e2f5e2f5m3gJm3gZu3iqK9jabAjKW+iqO9iaK8i6O9i6K9jaO/nrDG3t/g3d7e1tjaw8rTna7ElKfApLPFu8PO1NbYsLrJf5e1fZW0fJW0fJWzf5e2gZm4gpq4gpq4gZm3gZq3gpu4g5u5hJ25doqakanDjqa/jKW/iJ+3jKW+jaS+jKS+j6a/tcHNu8TNv8bOtsDLqbO9lajAiJ+8j6S/jaK9hp26f5i2fZa0fJa0fZe0gJm2gpu5g5u5hJy5hJ26hJ26hJ26hZ67hp+7c4KKh5SfgIqRen5/b21otbzFwcjPkafAjaW/jaW/jKS/n7DEpLPFlKOxhpy1hJy7g5y6gpu5gJm4f5i2f5i2f5m2gJm2gpu4hZ66h6C8h6C8hp+8hqC7h6C8iKG9iaO+WUgxYlE5ZldCcWRRcmFJgH19sb3Jm67Djaa/jqa/iKG9hZ+8hJ67kJugiJinhJ68g527gZu5gZq4gJq4gZq4gpu5g5y4hZ+6iKG7iKG8iKG9iKG9iaK8i6S+jaW/jqfAal5NeXFfbFpCcGNMbVxCZVpKhJSmj6e/jqe/jaa/iaO+hqC9hZ+8kJSOiZSZiKK+h6C9hJ68g526g5y6hJ26hZ+7hp+6iaK7iaO9iaO+iqS/i6S+jaW+kKfAk6nClKzDbGtdbm5iYGBSYmJSYmBPV1NCZ2JcjaW8kKjAj6jAjaa+iqS+iqC1kZKHhYqFi6bAiqW/iaO+iKK9iKG8iaG8iqK8iqK9jKS9j6a9kKfAkajAkqnAlavBl63CmK7EmK/EbW5hcHJoXV1TeHtva25jaGxiYGZed4SOlazAlKzBk6rAkKjAkqGrmJmOi42DjKK1j6jAjae/jaa+jKW9jqW+j6a+kae+kqrAlavAlqzBl6zCmK7BnLDBnbHBnbHDoLPEaGlbbW9hR0k/cHJnYWhhV11VZmlfZ2xoYWhuXmRqXmJmW2FnjZKPkJCEi42Cipiglq3ClKzBlKvAk6m/k6m/lKu/lqy/mK6/m6+/nLDAnbHBn7LAorPBo7XCpbbCrrrDd3hrbnFjWltRcnRnb3NoYWZdaGtfZWZaYFtOWFNHVVJFXFtThIV5fX5yd3lueX12l6q3m668nK+/m629mam0m669nbC+n7G/orO/o7W/o7W/pLW/qbfArbjBsLnBsbvCaWxfZGZZTE1DaWtdXGFXWF1Uam1hYWRYUVRJXF5TYGNVYGFTeHlrcnJjb3FjamxgX2lkdH13obG7j5iakJeWoLG7orK7pLS9p7a9qLa+qbe+rLe+q7e/rbi/rri/rri/X2JYYWNYR0lAZmhcU1pTUVhRZmpeWFxRQkc+UFRKYWRWYGFVYmRYT1FHTlFGcHVuPkc9eHxxXGZeam5jcHNpjpmalKKin6ywpbK3prS5qLS4qLO5prK5prK5p7O6pLK6Y2dcWVtRUVNLYWNWVlpRaGxlen93dXlwbHFndnlvd3lscHFmcnRpTE9EQUlGZGxpZWlee390Z21mbnNsaW1lamtcbm1bhYJvhIBueHhohop6jY6FlZSNkZKNj4+Ki46KZ2pgUlVMS09FX2NWXWBVY2lfWl9UYmZcam1kcnVtZ2lggIB0cnRpYWNXU1hPbXJph4l9aW1maGxmZmphWl1TPEI1GyYaGygcND4wOEAzOkI4RkxDWVxTZGdkZGViXFxYYWVfWlxWX2FZX2JbXmRcXWNbWF1WU1hQUlVNXWBYd3lxiIqAiYp/iIp/dnt0b3NrgoN3dnpxMTkqMzkoISwcGCcWFiIVEh8UGCQVIisZICwZIzAdKDQmMzswPkA7WFlTVllSWlxUX2FZVFdPVltSRktDTVJJaW1mf4N8h4uFiIqEioyDiYqAiYqBfoB2eHhrentwmZqRS1JHGSMUFyUVFCETGScXGSUXGyQUHyYWJi8ZJzAbGyQYFR8WKjAiLjEkUlNKTk9GOT02Sk5GZGdfe393hoiBiYuEiYyFiIuFh4qEiIuEioyFh4mBf4F3enlsdXdsjY6FjZCLLTgsEyASEyATEyAUEyAVHycXFBwSFB4SGyUTHCYWERkSFiAYFR8WODwzXl9WcXNpfX92gYN6hIV8foB3eXx0eXx1homChoiBhIZ/g4V9hYiBeHpwdXVqc3RsgYV/goiFaXJrFiEVDxwRERwSGyUaIikhFx4ZEBgPFR8RDhcPGCAbR09GNDszeXhsgoN4gIF2f4B0goJ2gIF1fH1zfX51hIV+g4V9goN7gYF5gIB2e3tweHZpdXRpbW5le394hImFgoaBY2hhS1NLRUxBRkpAUFVKWF5TRktBQUhDSVNOV2BXU1hQWV5Vg4N4gIBzf35ygYJ2g4R5g4R5gIF2fn91f4B3gYJ5f4B3f391gIB0eXhsd3NjdXFkcG9lc3Rtg4V/f4N+eX54X2ZgV1tSU1lSTlNJWVxSV11OY2xgLzcxKjItMjkzNDs3f39zgYF2hYV7hYV6hIV5foBzf4B0f4F1goN4f4B1fX5zgoJ3gIB1dXNleXRhdG5eb2xgbm9mfH92g4eAeX94c3pzUVdNWWFXPUc3YWZYUlVKXmVaMTYzMjYuKDAuJzAwhoZ6hIZ7goN6gIF0g4N2hYZ4g4R3foBzf4B0gIF1gYF1g4R6gIF3eXdpeHJhcm1cbWtda2xidHhufoR7f4eAcXlyVlxYOz81KTEiQkk3U1lGVVlLS1BINTkyJy8uJC0tg4V8goN5gYB0fX1wgH9xgH5wfoBxfX5wfn9yfXxvgYF1gH9zd3ZrenRjenVieHRicG1daWtfcnVqfYN5e4N8e4R+eYJ+cnlxWl9VKTEdLzYfQUY2UlhOQ0hDKjEvJi8ug4F0hIJ1hYN1goFzgoFyf39ygYFzgoJzgH9xfX1wfHxteXhqcG1fe3RgenNfdXBdbWlaampdbXBlen51d311dHx0gYqGd4F8OUI1GCISHyYVIysaRUs7WF1XOz87Jy8tg4Jzg4J0goJ0gYBwgoFyg4FzgYBxgoFzf31ugH5wfXpsenhqdXFhenNfeXRhdnFga2dZYmJVbnFnc3dtcXZtW2BYc3x2c3t1YGhkExwRExsOFx8SJy8hSlBCRExFNTk1goJyg4NzgYByhYR2hYN0hIJzf31te3lrf31uf31ufXxtd3RldW9ed3BeeHJgdXFhb21fZGNWaWxjcHNrcHVtdn14dn56dXx2fIR/SlJNEBkOFB0PJCwaQUU4SVBHPkI6e3xte3xufn9xe3psgoF0gYBzgoByfXxvgH9yg4J3fXxwdnVpdnBfenRid3FgbWhYaWVWaGdaaGthbnJpfIB2jpCEjI+CfH5xfn90fYJ7LDMtDxcLFx8QLDAcQUY7UllOentsfH1vfX1ve3pthYR3hYR2f35xg4N2hIR3gYJ2e3tvdnZpd29bd3BfcmxbbWhaaGRWaWhZZWdebnBndndqiIl8i4x/g4R3f4B1f4B1bHFrExkSERYMGiARNTouVFtS";	let cubemapPosX = "ytrmy93mzN7oz+Dq0ePs1OXu2enw3ezz4O/24/H55vP56Pb56/f87Pj+7fn/7fn/8Pv/9P7/9P7/8/7+9v/+9P7+9f/+9//++v/+/P7+8vr+8fr+7vf87/j87vf89Pr8ydnlytvmy93nzN7pz+Hr0uPt1+fv3Ory3+714vH35vP46fX56/f77fj+7vn/7vn/7/r/8/3/9P7/8/7/9P3+9P7+9f/+8v3+9v3+8/r97vf87vf87fb77vf78Pn7+v38yNnkyNnlytvmytznzd/qz+Hr1OXu2ujw3uzz4/D25vL46fX66/b87Pf97vn/7vn/7/r/8Pr/8vv/8vv+8vz+8/3+9f7+8fv+7/n97fb77fb77PX67PX57vf59vv8+vz8x9fjx9fkyNnlytvmzNzozt/q0eLs1+Xv2+ny4O305fL26PT56fX76/b87fj+7vn/7vn/7vn/7/n/7/j/8Pn/8Pn+8Pn+7/j97ff86/X66/T57PX58Pj5+vz7/P389Pj4xdXixdXixtfjyNrlytvnzN3o0OHq1OTt2Ofv3evy4e715PH25/P56vX77Pf97vj+7vj/7/j/8Pn+7/j+7/j/7vj+7vf97fb87PX66vT57PX59fn7+vz8/P388/f37fPzxdXixNXgxdbixtfkyNnmytvnzt/p0+Ls1+Xu2ujw3uvz4e/05fL26fT66/X67Pb87ff87ff92+Tp7vb87fb87Pb86/b86/X66/T57PX57/b59Pj69Pj69Pj49/r58/f2xtXixdXixtbixtfjyNnkytvmzd7o0OHr1eTs2Obu3Onx3+3z4/D15/P46vT56/X67PX67PX6sLi76/T66/T66/T66/T56/T57PX47PX47fX37/T37fT26fL06fL04+3yxNThxdXixtbhxtfix9njyNrly9zmz9/p0+Lr1+Xt2ujv3evz4e/15fH36PP46vT46/T51+Dkf4eG7vX67fX57fX57PX57PT37vb48Pb46/P26/P16fP05vDy4+7x3+vwxdTgxdThxdXhx9fhyNniydvky9zmzt7o0eHp1eTs2efv3evy4e705PH16PL36fP37PX5sbq6WmNf5u7x7fX47fX47fX47/X4+vv88/f46/P27vT17/X27fT07PLz5e7xyNXfx9XgxdXgxdbgxtfhyNnjy9zlzd3m0eDo1ePr2Obu3erw4u3y5PDz5/L26vP27/b4i5ORWWJgxMzN8/j68/f57/X48PX38vb38vb39vj38/b09fj18fX06vLz5fDyxtTdx9Xex9Xextbfx9fgyNniytvjzt3l0uDo1+Pq3Oft6u/x8/Xz8vf26vP17PT27fT2Zm9qU1xYoKin7PP27PP27fP27vP27fL17fL18PT07PLy6fHx4+7w4u7w3+rux9Tex9Xex9XeyNffytnhzdviz93j0N7l1OHm3Obp3+ns4ent5+7v6vHz7fL17PP10tnbXWdhWmVheoSB7fP27vP27/P18PT17PHz7fLz6fHy5u/w5e7w4u7u0t/caHRt1tze1d3eztjdydbdy9fezNngztvg0N7i1eHl3eXn4Ojq4+rs6O7u6O7x6/Hz7fLzoqqoXGVeXWdhaHBs2d7c8vX09Pb08/b08vXy8PPx7PHw6e/v5u3t5O3t4uzsl6OcztbYz9jZ0Njazdfazdjbz9rd0Nze1N7g2+Pj3eTk3eXm3ebo4enr5u3u6u/vy9LQXGdiUlxXT1hRV19Zcnhz4eTi7vHw7PLx3+jo2+Pi2ODe5uzru8PDvMXDjJaUND40ydLUydLUy9TVzNXWzdbX0NnZ09vb1N3c19/f2eLh2+Pi3eTk4efn5erp5uzrjZaQS1ZOSFJKRlBHQktDTlZOyc3H6+7s3uPhfoiCSldNYm5kkZuUT1pVJjUnIzEhJjIhxczOxs7Nx8/PyNDQydLQzNTSz9bT0djV0trX1t3a2N7a2+Dd3+Pg4ebi4ufjk5qTTFdOQUxENj83Q0tEVVxWfIOAc3l2YGphHSsfHCcfFiMZFyUaFSMaGCQaHywdHysedHyCfIOFgISGc3t+eIGDd4CEeICFbnh9eYKGkZiYeoiJjZiXlJ6eqLOxtsG+eYN+RExFKz9DMTs0PUU+VFpTLzs0LDgsKTYpKDInKS8sHCcgHCcfHCgfHyogHSkdHSgcSlZPWGFbW2NdU1tPT1lRTldTaHFuaXNvYGpnXGRhdHt1bHRxbXZwbnZwWWFZZmxhOjs3LDw+N0E8OkM+W2FbWFpTV1pTV1xXXWNiXWJfVltZR01MQUhIMjo0JS4jHScca3BqZWplbHFtVV9bU1taTVRSPERFPERHP0RGOTw7NDYyPkA8QklDSlFLaG5meHpuamxgWGFdeHxxfH90f4F4j5CKVltTS09KTlJNWVxYXmFfSU1LWV1ZWFpWWFlSUlNMNTk2NTU0QkJDPD49Rk5MNDMuMy8sOjczPD48PT8+Q0pLRE1NKzUsSlNLm56WcHJncXJnSlJPdnpzhoh+jY+HnZ+ZmJqViIqFaGtmUFNOQ0ZCUFFOVlhUW15YXmBaU1RPODw8REdLcn+EO0dKRVJTP0ZEQUA2OD0qMzsrJzQoMj8/KjkvLzsxgoeBiImBamxjc3NpdXdtg4R6h4mBjI+HmJqVmJuWl5iTjo6KhoeCd3hyWVtVTFBJOz04R0pFVlhSQ0xLPEdGKDEyKzU3Lzs3IC0dHisbHCkZFSIWFSIVGyobHC0dYWlfh4qEgIF4amxkdXVreHhvhIV8h4iAjI2GkJGMlJWQlJaQlJaQkpOOi4yHiImDf396bW5mWltTQ0c/NDs2MzcyMDMvMDY1KTIqIywfFSAVEBoSEBoSDhcREyAWS1VMjpGMhomBeXpybm9nfHtxd3VrhIV9iYqCkJGLkpOOlJaQl5iSlZeRlZeRk5WPj5CKjY2Fhod+hYZ9fH11KTAsLC8pLC8rODw2UVFCLTMmEx0TDxgRDBQQDBMRLTUviIqFiouEhoZ+dHVscHBnfXxye3hreHlvgIF5h4iBi42GjY+Jj5CKj5CIjpCJj5GLj5CKjo6IiImBhoZ/iImAGSAcISQdKy4pKy4pRkg5HicXExoRDxYRERgVFRkZeXt4iouFjI2Eg4N6cXJocHBmfHtwfnxveXhugYJ5hoZ/goN7g4V+gYN7gYN7hoiAioyEjY6Ij4+Ii4yEgYJ6f4B4JB0OFBQQIyIcHycaHCEXHyIWKzAsMDo1HSMfX2FhhoiEhoeBgYF3fX1yb3Fnb25jeHZre3hrd3ZqfH10g4R7hoZ9goN5goR6gYR5foB3goR7g4R7hod+iYmAiYl/gYJ2IyMiIiUiGBsXIiYWIykZJS0XKjUgICkUR0tDjpCKjY6HjY2DfHtwenpvbW1jb25kfHxxgYF1fXxwenpwfHxyh4d9iol/jIyBioyBh4l9g4R4goR4g4R5g4R5hIR5goN3JisnISYhKS4lKS8bIywUICcSHSQRMzclh4iDj5CIiId+hoiBfX51eHhsaWlecG9jfXtvfXtte3hqdXJne3twiIh8hoZ6hod6hIV4h4l8hYZ5gIJ2g4V5g4R4g4R4hIZ6MDQsLTIjKjAaHygUGSAPGR4PICYUcXRsj5CJjY2EhYN4gIB0fn1yeHhsaGdbc3Fke3lrfHpreXRkdnVofX5ygoJ4hYV4h4d6jIx/i4x/jY6Ai4x/hYd6iox/iot/hIZ5KS0aSFJMICYYGx8QGSAQFx4PTlBKjI6Gk5SMkpKIjYt/iYd6gH9zdnVpaGdXdHNleXhqf3xtfnpqfnxsfX5yhYZ7fX1xhYV4jIx+jo2AjY1/kZKEjI1+hIZ3i41/iot9JykXHSQTHyIRGSESX2dfZmlmi42HlJaNlJaMkJCFjYt8i4p9fnxxb25jaWhacG9henhrfXlrhIBwhoNyf39zfX5zeHhuhIR3iIh8jY6Aj5CCkZGEj4+Biop8iIl7i41/Li4WIikSHCAPVl1beoF8i42GlJaOlJWMkpOHkZGEjIp8hoV4fnxxbGtfZmRVdHJje3lrfnptgn5viIVzeXlrfX5xhIV6iId8i4uAhod6hod6jI6AjY6BiIp8hod7hoh6";	let cubemapNegY = "YWZcfn9xcnRoSU5EJCsaJCoWJCsWFyMRFB4PEx8NER0MEBsLCxYKEB4MEh4NDhkKDxsKERwLDxwKEhsLFBYLEhMKDRAHHx8OGBoLKCQSGBkMGxwNIiUPJy8UJzAVKTAVSEs9fX5wb3FmNDkuGiIQFh4OFB4NEhsNEBsMExsNERwNCxUKCRMJDxsMDxoLDRkJDBgJDRgIFSMLEx8MERYLFRYLHB0MIiIPGxwNFRUKFx0NGB4PGR8NGB8OHyYRHiYRICYXV1hOUVNNMzgxFx8QFBwNEBcLEBYKEhsNEhsNDhgMChQKCBEICxcJDBcJCxYICxcIChQGEB0JEBsLERQLExQJFBUKKScQGh0MFBYKERYJExgMFBsMFhkLGCAOGBsNFRsOFx0RJikgJCkfFx4QDxYKDBIKDBEKExcNDxkMDBYKChQJCRIIBxEHCBEGCxUICxUHChMHFSQLEx8MFhkMEhMKDQ4IFRcJIiMPGxoMExcMDxQKFR4NFyAPFRoMKzEjLTMvMDUwMDQxLzMwMzcyLjQtKi8rLzMuJi0iJi8lJCskJSwlIysjIygiJSwmJy4nKjEoLjUpLzgpMjsrMzYuLi8qLy8pLy8nPj0xPjwwNTYwMjUuNDUtMTMuMzYuRUpCeXx1fIB5dHlxfYF5eX12fH94foJ8dXp1g4mCfYJ4iY2FjI+IhYqCe4B5f4R7h4qBio2EgoR5iIh9gIF4gIN6goR6gYN3hIV+hIZ+iYmBjo+Hi4uDi4uDkpSLj5GJjpCIf39zf4B0f39zgIB0f4F2g4V8hIZ9hYuEjpOLgoZ8jI+GkJKJjpGHioyChoh+jY6EjIyAjIyCkJKIiouAi4yBiIp/goR6g4R8i4uBkZGIj46FkJCHkZKIlZeNk5SKkZKJgYJ3goJ3goN4goN3g4R4goR7fX93goeAiY2EgoR5io2DkpSKi42Ch4p/jo+ChIN2k5SJkpKHlZWKj46DkJCEk5SJkpOIj5CFlpaMlJSLkpGHk5OIjo+EkpOHlZaLlZaLhIZ6hYZ8h4iAh4mAiYqCiouBjIyDiI2HiI6JfYB2iYyBkJKHkpOIgoR5gYJ3iouAkZKHjY2BlZSIj42Ajo2BiYl9fn50jYx/k5GFkI+EkZGEjo2Bk5KGj41/j5CFjo+EjY6Cjo+CiYp+iYp/jY+Ghoh/hoh+i4+GhIiAiot+jIx+jYx+jo6Biop9jo6AgIBzh4d7jo1/iol+jIt/kI1+iIV2ioh5k5CClpOFi4l7j4x+jop8jYp8jop7kI+CkI+Eg4N2goF1goN3gYF1hYV4g4N3g4N3gIF0hIR1gYBxi4h5f3xshYN0gYBxh4Z4eHdofXxuioh7ioh7hoN2h4Z5jot9jYl8iYR1ko5+jYl5j4t9gHxtioZ5iIR1jIp9iYh7enlsenlueHlvd3dreXptd3htdHRqdnZqfX5xgYFzgIBzfHpud3Zog4F0f3xwgX9zf31yiIZ5goBzfntvgoB0hIJ2iIV4hYJ1gX1vhoJ0hIBygHxuhoN2iYV5iYd7gH1ya21kamtibW1kbG1kbW5lbGxhcG9kb29icXBjd3dreXptenlse3tvenlte3pufHpue3dqe3hqfXltfHlse3dqe3dpf3tugHxugHxuf3psgHtugH1wgH1xf3xwgH5yfXxwZmdgamxka25naGpkamxjbG1jb3Fnbm9kbm5jb29ja2tebm9kcnNncXJmcnNob3BleHdseHdseXdqeHZqd3Rncm9ibWtebWpdbGpeamhcbmtfbmxfbWpdcXBjb21hb21hZmZbbGxhb25ka2xkcnNqbm9mdXZqc3RocHFmdHVqdXZqdHRodXRocXJndXZqdXZreXpventwfXpsfnlsgn1vfnlrbWhbaWRXZ2NWZWBTZWFTaWVWaGRWbGhZbGhZcG1dbGtgcG5iaWhdd3duenpxeXtye3xyenpvenlue3twfXxxe3pue3pvenpufHxwfHxwfXtuhIBzhH9wgXxvhoBzgHpsdXBic25fc25fdXBhdG9hdnFidG9gcm5gdnNkc3FidXNmcm9idHBkfX52goJ5hIV8g4J2f35ygYBzgX5wgH1vg4BzgX9ygX9ygH1vgn9yhYR2hYFzh4FyiIJ0iIJzh4Bwe3VmenRkfXZmf3lqgHprf3prfXhpfXhpfXlre3hpdnNldHBheXZqgYJ7hoZ+iIl/g4N4hIV6h4Z5hoZ4hYJ0h4J0hYFzhoR2hoV3g4ByhYR3ioZ5jYZ1jod3jod4jIVzgnxsgHpqhH1thX9vhoFxhYBwhYBwg39vhIBwgH1udXFid3NleXZpgIF4hod+hIV7hod8h4h9hYV4hYN3iIV5hYJzg39whoR3hYN3iIR3hoR3iIZ4joh4kIl5jYd4j4l4hX9vhX1shn9uiIFwiYNyiYN0hoFyhYFwhIBwgn9vd3NjeXRkfHdngYF3hYZ8hod7hod7iId7iId6hoR3iIZ4h4V2h4NziIV2iIV3iIV3h4R0iYZ2j4l4kox7kIl5kYt6g31tg3xqhX9vh4Fwh4FviYRziYN0hYBwhIBvhoNyc3JkdHNnc3RpdHRpd3dtd3dsd3dseXlue3pudXRndHRndnRmcXBjcnFld3VodnRmcnFkdHNmdXRmd3ZpgH1vfXhogXtsgXtrgXxrhoFwgn1tgHxvgX5yfnxvd3ZpdXZqentufHxwe3xyd3dse3pvfX1ygYF4gYF2f4B1eXlseXpueXpsdHRocHBlenptgYB0fHxwentufn5yd3dqfHxueHRkdXBfhH9thoJyhH5ug39wiId6hYR3hIN2hIJ1fX1ygIB0goF0fn1yfXtwgoF4hoZ9h4d+hYV7hYZ6gYF1g4R3fn1we3tvc3NnfHxvgoJ2gYF0gH9ygoF1gIBzfX1xfXtsfXpohYFvhoFwhYJyh4R2i4t+i4t/jY2AiIh7hYV5hIV4hIR4goN3gYB1g4J4hYR6hYZ8iYl/i4yBhIR3hIR3gIB0goJ2e3tufHxvhIN2hIN2fn5ze3tuc3VsfX5yfX1vgn9vhYNxgH5thIFwjIp6i4p8kI+CkZGFkJGEjY2AhYV5hYR4hIN3gH90gIB3h4Z8iIh+ioqAiYh8hIN1hoN3goF1goJ1gYBzfX1xhIJ1hYN2gYB0eXptb3FodndrfX9wgH9ug4Bwg4JyiYd2h4Z2hYZ3iYp8iop9jIt/iop9f35yg4J3goF1f31xfHpvfXxzgoB2hIN5hYR5fXxwfHtve3tufHxvgoF0fHxwfXxwenptenptcHJkaGteamxfdnhqfH1tf39ufXxsg4FygoFyhIR1hYZ3hod4hYd6g4R2hIN0hYR2hoN3hIJ3gIB3entyentwgIB3fX50enlteXlsdXRndXZpd3hsfH1yeHhrcHJlbXFka25hbW9jbnFjeHptenxueX1uf4BwfX5vfn9wh4h4gIN1h4d4iYp7iYt8hYV4iIZ5h4V4hIN3hYV6fXxwfXxwgoJ3goJ3f39yfHtteXptd3hqeHlrgYF2fn1wd3ttcnZpb3Fjc3ZocnVoe31weXtse35vfX9vf4Bwe3xsgYJzhYZ4iIl6h4h5hIV1g4J2goB0hIJ1gH90f390dnZqfXxvf31vfn1wfXtvgH9xfX1uenttfXxufn1xfHtueHpseXtuc3VndXdocXVpen1wfH5vfX9we31ugIFyentrfX9xfn9wfn9wgIBwf4BxfHttfXxue3prfn1wfHxweXdrfnxugH5xf35zfHtvgH9xfX1vfHtsfHxueXlsentsenxte3xueXtse3xveXpte35xenxue31ve31ufn9weXlpfH1thIV2g4V3fX1uhIV5gIByg4J1gYBzfX1wfXxwfXxufn1wenlugIB1e3tvf39xf39xfn1wenpse3ttfH1ugIJze3xuenxufH1venttfX9wfn9xfoFyfn9xfoBxfH1tgIFxhIV2hYZ4iIl7iox/fX1vfn1wfn5venhqf35xfXxvfXxve3pufX1xe3xvfH1vfXxufHxue3tufHxufn9wfX5vfn5xentseHhqcXJkd3lqe3xtfoByhYh5hYh6gYJzhIRzhYV1hYZ4hod5hoh6";	let cubemapPosY = "iaG7iZ+7jKK8jqS9kKa+lKnBl6vDnrHHprjLscHQucjXvcvawM7ew9Lhx9bjy9nmytvozN7q1OPt1uXv2Ofw2eny3uz03+324vH44vL55PL55PL55vP57vf79/r98fn8iaC8ip+7jKK8jaO9kae/larBl6vDm67GobTKrL3Pu8jXv8zbvs3dw9LhyNfkydnmydrozN7q1OTu1+fw2enx3Ov04O723+/34fL54vH54/P64/L55fT77ff88fj88/r9iJ+6iqC7jaO8jqS9kKa+lKrBma3EnK/GnrPIqLrMxNDa1d3lv83dxNPiytrmy9zoytzpz+Ds1OTv2+ny2ury2+v03u723e/44PH54vP64/P64/P65vX76/b77vj98/r9iZ+6i6G6jKK7j6W+kaa/l6zCmq7FnbDGobXJqbzN2+Dk7e/wydThyNXjzNvn0N/qz+Hs0OLt2ujw3Ory3u313ez24O/43/D44fL64/P64vP65fT76/b87Pf97Pf97vf9iJ+6iqC7jqS8kqa+m67Csb/MnbDGmq7ForXJrsDO1Nvi9PXz2eDo1t/ozNzn0uHr2Obv2+jw5e7z8Pb46vT45fH44/H55PL65/T84/P75fT86/f96vb97ff+7Pf98fn+iJ+6iqC6j6S8pbXGwMnRw8vUprfJmq/Fs8LQwMzW3+Tm1dzkxdHfy9fk0d7p2eXu2ufw4+709vn6/f799Pn68Pf75fH58Pf77/n86PX86/f97Pf96Pb97fj+9/z++P3+iqC7i6G7jaK7sr/LzNPYy9HZsL/NoLXHzdXcy9Tct8bUrL/Ru8va0Nvk7vLz7vL08fb38fb4+vz99/v8+fz++/z+8vb5+fv7+/z8/P39+Pz98Pn+7vj99vz++f7+/f/+jKO8jaO8kKW9o7TFzdPZzdPa2t/issHPwc7WucfUnrXKobnO1+Dm5Ort+/z6+/v6+Pn5+Pr5/v7+/P39+vz9+/z99vn5/Pz8/P38/f7+/f/+/v7+/P7++f3+/P7+/v7+jKK7jKK7jqS8lqrArLvJxs7Vxc7Xv8zVtcXRmrLHl7DGscPTzdfg5+vt9vf29PX18vT08/X09ff18/f2/P399/n5+vv6/P39/f39/f39/v7+/v7+/f7++v7++//+/v//jKG8i6C7jKK7kKS8na7CmKvBr77MvMnTobbKpLnMmrPIpbzOytbg6+/v5Ojp8PLx6+3u5urp4ujn7PDv9ff16+/v+fr6/f79/P37/f38/v7+/v7+/f/+/f///f/++P7+i6C7ip+6i5+6i5+5jKC6jaK8jqS9lqvClKvDla7GmLHIm7bLrcLU3uPn2uHi6ezs4uXn5ejn2uDh6+7u6u7t6Orr7fDv9vj29Pb0/f38///9/v/+////+v/+9v/+8/7+iZ65iJ25iJ24iZ64ip+4i6G6jaO8kqfAlqzElq7GmrTKnLbMnLfN1+DmydHWzdXY2t/h193d4+fm6u3t5+rq3+Pk5+rq7/Hw9fX0/v79/P36/P38////9//+9f/+9v/+hpu3h5y3h5y3h523iJ63iaC4jqS8kqjAlqzDmLDGmrTJmrXMnrnPr8TWyNHYwsrPxs3Q1Nna5eno6Ovq6+7s4eXl6u3s8fPx9/j2/f37+/v4///+///++v/+9///9f//hJq3hJm2hZq2hpy2iJ24i6C5j6S8k6nAlq3EmbHHmrTJnbnNo7/TqMLWzdrjy9Tbxc/Ux8/T193f2uDg4ubm5ejo7vDu8vTy9/j1/v77///9///9///9+f//9f//9P7/hZu3hpu3hpq2iJy3ip+4jaG6kaW9lKjAlqzDmbHHnrbLobvPo8DTqcXZrMbavtDd3OTq3OPm197h4ebm5eno5Ono7/Hv9Pbz+Pn2/f77///+///9/f/+9v//9P7/8/7/lae+j6K7jaC6iZ23jaC5j6K7kqW9lanBl6zDm7HHnrfLo73Qp8LVqMXZqcfcq8jcytzs7vT35uvs2d/h4+jo6u3t9Pb0/f38///+////////+/7/9f3/9P7/8/3/8fz/09fb3N7hpLHFkKO8oK/DsLzMtMDOmKrBl6vDmrDGnLTKobvPpsHUqcXZqcfcr8vhs9Dms9Dmv9fq4+303ev15vD17PT49vr89/z+8fr+7vj96Pf+6/n/7vr/7fn/7Pn/ztLX5+fn4eLk5+jo2d3i5OXm8PDvs7/Ol6zDma/GnLXKn7rOor7Sp8PYq8fdsc3jttLnttLoudXrxODyx+L0y+X21Oz53vH84/X+5fb/5fb+5PX95/b+6vj/6vj/7Pn/qLXG1tnd4OHj4uPj7e3r7Ozr3ODlorLIlqvDmK/GmbPJnbfNobzRp8LXrMfdsczittHnvdjsxeDxyOP0y+b10er31+763vH84/X+5/b+5/b/5vX+5/X+6ff+6vj/6vj/m6rBobDDxsvU5OTl4OHj0dXcq7fKlqnBlqrCmK/FmrLJnrjOorzSqMPXtMzgvNLmwtrrzOLwyOHxyeX0zOf00ur31u353fD64fP74/T95fX95fX95fT95vX96Pf+6ff+3t7gucHPu8PP2NrexMvU1tjemqvBlKe/larCl67FmbHInrfNo73SxNTi6/D0+vv87vX57PT42uv0z+bzzufz0en11ez32+/53/L54fL64vP64vT75PT75PT75vX85/X64eHi7ezqvMPQnq3CmKjAm6vBkqW+k6fAlqzDnLLIo7jMzNfh6O3w4+nr5uvs7PHx9/n4/Pz7+vz85PH22uz10+n12Oz22ez43fD33/H44PH44fL54/L65fT75vT85vP61dbbvsXSqbTHj6K7jKG7jqK8k6fAxc3YusfUztff1Nzj3+Xo5urr2uDj0trd2+Hj6Ozs9fb1/v78/v/+7vb53u724fD22e312ez22+723e/23/D33/D34fH34vH44/L5z9LalKW/jqG8lKe+kKO9lKbAsLzNztbcx9Ha5+rq3uTn5+vt5unq193g09nc19zf3uPk6+7u+Pr39/n3+/399fr73u302Ovz1+r01+rz2ez03e713e713e303u714O/2pLHFiJy5h5y4ip+5kaW+r7zM5ebmytPZ0Njd6evq6Orp7/Du6evq1drc09jb19ze2N3g4eXn6e3t7fHx/f797vX31efw1ujx1ujy1efx1uny2Ony2uvy2uvy2+vy3OzzhZq4g5m3g5m3iJ25pLPFy9LXusbQp7jI0tnd4OTl4uXk29/g3uHh3+Li3N/g3N/h4OLk5unp6evs6Ozu8fX23+rw1+bu1ubu1+jw1+fw1ujw1efw1Ofv1ujw2Onw2Onwgpi2gJi2gZi2hJq3h564j6S8j6O9rrzK19zf6uvp297g1dnb3N/f4+Xj5Obl6erp8fHw8fLw8vPy5eru3ebs0uDp1uPs0eLr0uPs1OXt0+Xt0uTu0uTu0+Xu1Obu1efvf5a0fZW0fpW0gpm1hJq2g5u3hZ23kqa9m67CprfIwMnT1trc2t3e4+Tk5+no5+jo7O7s7O7t9PXz+Pn3ztvlzNrmzdznzd3ozt7pz+DqzuDqzuDrz+Hs0OLs0ePs0uTsfJSzfJSzf5e0gZi1gJa0f5e0jKC6o7HDkqW+qrfIlqnAt8LO4uPj7u7s8/Px8PDu7e7u5unr1d3k1N7lx9ThydfkyNflzdvnytvny9vozNzpzN3pzd/pz+Hr0OHr0OHrfJSzfpa0fpa0fpWzfZWzfpa0lqi+vsbPqrfHvsbQsbzM1tnd4ePj6erp7e7s8/Px9/f08PHw4+jrv83cxNHeyNXixtTixtXjx9bkyNjmytrny9vnzd7n0OHpzuDpzd/pfZWzfZa0fZW0e5OyfJSzfZa0l6i/ztLYzNDX7Ozr5OXm8fHu8PDu5ujo1dvg6+zs2+Dlv8vYtcbVu8rZwc3cztnkxNLgw9HgxNPixdXix9flytrm0N7n0N/nz9/nzd7nfZWze5Sye5SyepOyfJSzf5e1k6W9w8rS1djb7e3q5+jm7u7r8fHv3uLlp7jLw83Y1dri8fLx4ubq197l1dzlz9njwM7ewdDfwtHgw9PgxNTiyNfkzdzmz93m0uDnzt7n";
	let cubemapNegZ = "/P39/f399fr85/T55fL45PH35PH44vD33+313Orz2Ojx1+bw1uTu1OLtzd3qytroytnlxNTiw9HgxNHfwMzcucfXscHRqrvMobPImKzEk6fAkKW+jaO8jaK8iqC7iqC7/P38/f39/f398vn76PP46PP45fH34/D23+313Orz2ejx1+bw0+Puz+DszN3qydjnx9blw9LhxNDfydTgvsvatsXVr7/PqbrMnq/DmazEk6fAj6S9jaK7i6G8iqC7iqC79fj58ff3+Pv6/f789Pn69fr85/H24+/24O313evz2ujw1ubv0OHszd7sytrpxtbmxtTjw9Dhws7evszbtsfWssLSq7zOprjLj5yrmazFk6jAjqO+i6G7iqG7i6G7g5mx6fDy4evu6vHx+fv5/f38+vz87vX45/H36vP36vL38PX44Ovy0eHsy9zqyNnox9blxtPjwc7fvMvbt8jXs8TTrb/QqLrNo7bKipSemKvEkqfBjqS+i6K8i6G8i6K8g5iv6fHx3ujr3OXp4ens7vPz+vz6+fv69Pn6/P39+fv8/P379/n46e/yz97qydnnx9XkwtDhvMzct8jYssTVr8HSqrzOpbjNn7HHhIuPl6vEkqjCjqW/jKO9jKO8i6K9Z3iK7PLz5+7v3OXo2+Tn4Onq7PLx8/b1+vv5/v78+vv69/n47/P17vL02eTsx9flw9Livs3euMnatMbXsMLTq77Qp7rOo7fNmKe7bnFtj6O5kqjCj6a/jqS+jaS+iqG8S1Rc3uvx5u/x6e7w6u7u4unq4enq5uzs6O3u7vLy9vf27/P15Ovw2eTszNvnxdXkwNDgu8zct8jZssXWrsHTqbzQpLnOobXMg4yWY2RfhJallKrCk6jBkafAkKbAeoqiNDUx3erw2+nw2efu4+zw6u/t2+Tm4ejp4ujq4ejq6u3v7fHz6u/y8vT02+TrwtPivs7fusvctsjZscTWrcDTqLzQpLjOobXMfYKDYGJccHp9kqe+lqvDlKrCk6nBc36MNDMq4ezx3uvw2ufu1+Xt2ufr2ubp0uHo1ePp2uXq4ejr3ubszt7o0t/oyNflwtLhvc7eucvbtcfYssXWr8HTq77RprrPorfNeHx8YGBYc32Blaa3ma7GlqzClqzEd4OWRj804e3x1eLl0Nzi2Obt0uLpzt/nzt/nzt/ny93mzd3mzt3nytvmxtbkwtLhwNHgvM3duMratMfYtMXWssPUrsDSqbzPpbnOdHh3X2BUeYKDkJaXjJqmgouTfoOHX1dNamFT1eLki5qYd4OGz97liZiYzd3l1OPqytnezdzk1eLp6Ozs4ufqyNjlw9PiwdHfvs/eu8zcuMnZtsfXs8TUsMHRrL7QqLvOgoeGbG1ieH9/goF4XFRHUUc2TkIuT0Qta2hbbXh2U2BbSFVMR1RKS1VMYmxi09XUxMrGyM/S5+zs3+bo4efo0N3ly9nixdTfwtHev8/cu8zaucnYtsfWs8TTscHRq73Oe4B/Xl9UbW5md3hxV1JIT0c3Tkc4VlVHcHFoLDcrQEpANEAwOUQ3NUE1doB+093fmqKeo6ut1+Pm0d7kzNri0dzj1d/k1d7iy9bex9Tcw9DawM3YvMrVusfTtMTQsMHNfoF/Y2FWa2dafX5zX2BWXV5VU1dOZGVZZGVXLjktLzosJzIkJC8fIy4fNT8zoqypeYB7aG9sRVNLrLa32uLi3eLh3+Lhxc3P0dncxtLZws7WvcnOxMzSytDUvsjPsb3Ea2xiZmdbdnZqenpvY2VcW15XVFpRYGNYYGFUIy8iJzIjKDAgIiweHyodISwbJTAjZWplY2pmHSkhLjoybHhxtbi1cnpyP01De4SDjZSVlJ6fTGJcVGRdtb7Bo6aqi4+QWk89bm9idnZqdXZvZWheZGZfWVtUUlVNUlNIJDAkKTIiHSgaHigcHSgaFyQYIy0jPEM3PkQ7LDQtDxsSFiQaGSYdGikcHy8jQE08NEAyLkM+IzoxM0E1amdhTUhCVlhPZmdaaWtcdndsbW1jZWZZX2NbWFxTTE9GU1VLHyoeHCYcHCYaGSIYGyUaGCMWHCgZMTkuOD01LTUtDRgRDxsSFCAYFiMZFiUbHi0eGSseNUhEKjotKDcrNUM9RE9RXGBZYmRZZWZaZ2hdamtgY2VYXWJbTVBKSk5GTlFHHCYdHCQcHCMXFh0XGSQXGiUXFSEUHCUYKDIkLjgqLDUqKzEmKzEnMTcsNDsuLDQwQUlAYWpiPEg7Mz80TFRNVFxYOkM0RExBR0tBMjoqQko6ZGdcUVdTVVlSWVxWTE9GTE5GXWBbXGJdXGNdWmNcWWFYWV9XWmBZWmFZYGdgaGxkZ2tiZGheYmRaY2ZcXmNZWmBTZGdcV1xQVlxQXmRYbXBqYGVcWl9UWV1TV1tTX2JbX2FfWGBgV1tZYWViXWFcTk9KY2ZjZWlmZGhkZGpmX2NfZGhlX2ViXmNiYWZkYmdjam9raW1nZmphZGdcY2ZaYGNXYWRcYWRcYGNbX2JaY2dgZGdhZGZhU1VQWlxWWFpUWVpTXmBaXmFcWl1YTVFLX2FaX2BaVlhRUVJKT1FKTk9JTE1ITlBJSUpFTU5ITlBKTlFKYGNbYWVeZmlhZmlfYWVdXWFZXF9XXmBZXF9aYWVeZWhkamxnZGVeY2ReZGZfZWReZWVcXV1UWlpRWFlPUVVPP0I8SEpGREdAOTs3R0lDJywmRUhDMDUtVFZRT1NOMzgzRUpELDQqSk1HPEE5RUlDTVJMOT84TVBJNDk0QUQ/PUA7S05HT1FKPD85UFJMPD04VFVOTE9JQ0Y+R0lDdnhudHZrc3VrcnNpbW5kcnJpcnJocXJoc3Rqc3RqdHVscnRqbm9kbW9jdXhueXxzb3Blbm1ibGxhb3Blbm9lcnNqcnRqcXBldHNocXBldHNodHRqd3dsc3NocnJncXBjh4d/hIZ9goR7hoZ9ioqAiIh+hod+iIh/h4h+iYqBh4l/i42Ei4yCiYqBiYqDiYqDhoZ9gH9zgoF2iYqBiImBhYd/hYd/hoZ+hoV6hIJ4g4F3g4F3hIN4goF2gH9zgoF2f4F4gYN5g4R6gIF3gYF4h4d+iImAiYmAjI2Ei42Fhoh+hoZ7hYV7h4h/iouCiouCiYmBiImAh4mAh4h/i4yEioyDhIV7goJ3g4N5gH50gYB2gIB1f391gIF3f391fXxxgoN4hIZ6hYZ6iIl9iIh9iYp/hIV7hod9h4h+hIZ9goN4g4N3goF3g4R8h4h/iYp/g4N5hYV8g4N6g4R6iYuBioqAiIh+g4N4hIR6gX90goF1g4N3hIN3f39zg4R3hIV5goR4goJ2hYV5hYZ6iIl8g4R4gIJ1f4B0f39zgIB0gYJ2goJ2g4J2iol+i4uAiop+hIR5gYJ4gIF3fX91hIV6i4p+iol+hod7fn5yg4B1hIN3g4J1gIBxgH9xgYBzhod8hYh7iox+jY2BjY6Bg4R3f4BzgIN0f39yentugIF0f39zf35xgoF0iId8jIuBjIyAhoZ5gIB1gYF1fn90e3twiYh7i4t+iIl8gYB1f390gH9yf39xf4BygYJ0g4N0g4Fzh4l8iIp8iYp9hoZ3iYl5h4d3hoZ2hIR0iIp7iIh6hYV3fHxtf35wgH5yhIN3hYN3gYByfn5xgoB0gIBze3ptfn1xgoF0fn1wgH9zfn1xfXptfHtvfoBye3xvgIBygoJ0i41/jY+Ci4x8jY1/jIt9i4t8h4d3jI19iot8h4h6hoZ4hYZ4fn1vgX9yfn5wgoF0goJzf35vgoF0fn5yfn9zfX1wgoJ1f39ygoF0goF0f3xufXtsfn5vfH1uenttf39xjI6Biop8jIx+iYl7hoR1goFyiox9jZCBiox+g4Z3goN1e3ttfn1wf39xf39yg4N2goJ0fn5wf39yfXxwgYF1fn9zgoN1goJ0f31wgH9ygoF0e3lre3psfX1ve31ueXtsjIx+jY5/iop8iYl6hINzgYJyjpGEiYx9hId4gYN1fn9wdndod3dqf39xgYJ0goJ0gYJzgIFzfXxvfn1wgYFzfoB0e3xvhIV4goBzg4J1gYF0gH9xenlqfHttfn5we31v";

	let cubemapPosZ = "fJWze5Sye5OyepOyfJSzfZW0gJi2kaW9qLfIztTY3d/g3eDizdXbqbrMnrLIssDR5efo7O3t2+Dl5urs2N/mz9nivs3cvs3dwM/ewdHexNThyNbiydnky9rkzdzly9rlfJWzfJSze5OyepOze5Sze5SzfJW0fZa1gZm3kKa+m67DorPGsb7OwsrVydDZwcvX1drg5OfpztjgwtDbt8jXuMnYu8vavMzbv87dwNDdxNPgxtXhyNfiytjjydnjytnkfZa0fZW0fJSze5Sze5SzepSze5SzfJW0fJa1f5i3gpu5jaS+o7TImq7GnrHHp7nMxM7Y7+/u0NfguMjXssXVtcbWuMnYu8zavs3bv8/cwtLfxNPgxtXiyNbiyNfjydjjf5i1fpe1fpa0fZW0fZa1fZW1fJS0fJW0fJW0fZe1gJq4hJ27iqK/jaTBkqjDmK3GqbrNzdXe4uXo3eLnu8rYs8XVtsfXuMrYvMzav8/cwtHew9LfxNPgxNTixtXix9XjgZq4f5i3gJi2f5i2f5i2gJi3f5i2fZa1fZe2f5i3gJq4hJ27iaG+jKPAj6bClKrFma/IorbNqLvQrb/TrsHTsMPUtMXWt8jXvMvZv87bwdDdwNHewdLfwtPhxNPixdTihJy6gpu5gZq4gZu4gZq4gpm4gZm4gJm3f5m4gZu5g5y6hp+9iKG+i6PBjqXCkanFl63HnbLKorbOp7rQq77SsMLTssXVt8jXu8vavc3bvs/cvs/cwNHfwdLgw9PgxNTihp+8hZ68hJ68g526hJ66hJ26g5y6g5y6g5y6hZ67h5+9iaK/i6PAjaXCj6bDkajEl63HnLHKobXOpbrQqr7RrsHSssXUtsjXucrZu8vavMzbv87dwNDfwdLgxNPgxtThiaO/iqO+iaK+iaK+jKW+k6i/iKG8hZ+8hZ+8hp+9iKG/i6PAjqbCkKjEkqnFlazGmbDJnbPLorbOprrQqr7Rr8HSssTUtcfWt8nXu8rZvs3cwM/ewdHfwtLfxdPgxtThjqfBjafBjaXAjKXAjaW/k6nAm67Cjqa/iqS/iqS/jKXAjqfCkanDk6vFlKzGmK/InLLKoLXNo7nPqLzQrL/SsMLTtMXVtcfWucrZvczbwtDexNLfxdPfxdTfxtTgyNXgk6vCkqrCkarCkKjBkanCmq7DpbbGl6zCkqnCkKnCkarDk6vEla3Flq7GmbDInLPKoLbMpbnOqLzPrb/RssLTtMXUt8fWu8rYwM7aws/bx9TezNjg0tzjy9fgytffydbgmbDFmLDGpbfHlq3ElKzEk6vDlKzEl67Elq3Elq7FmLDGmbHHm7LInLPJorfLt8TRxM3VvsnTssLRusfTztLZ1Nfb09fcz9Xcx9Hbw9DcxdLcxtTdyNXfytfgydffx9Xeu8HHtb7IwcXJtL/Ir7zGobbGm7LFm7PFm7PFnLTHnbTHn7XIr77LvMXNy87SyM3SyM7TytDVwsrUyc/Wyc/WxM3XvsrWv8zXws/Zw9DbxdLcx9TdyNXeydffx9bdx9XdsrzFtr7GusHHv8XIt8HGrLzGq7vGsb/GtsHItsLIrL3Irb7JscHKtMLMuMXOtsTOtsXPucbQvMfRvMfSvcjTvsrVwMzWws7Xw9DZxdLbyNTcy9fdy9feytff0Nre1t3fsrzDs73Etb/Ft8HFuMLFuMHGucLHu8THvsXIwMfIwsjIucXJtsTKtcTLusbNvsjOvMjPvMjQvcnQvcjSwMrSxs3UydDVydHWydHXztbZ0NfZz9ja0Njbz9jczdbbzdXarbrArrvCsb7DssDDtMHEuMLEucPFu8TGwMbGvsbGwsjHv8fHusXIu8bJv8fKxcrLxsrMxsvNxsnNw8nOxszPyc3Qzc/SztLTzdHTzNPUztXV0dbW0tfXz9bXzdXXzNPWpLS7pLS7qLi+q7u/rby/sb7Asb6/s77As77AtMDBt8LCuMLCuMLDt8LDucLEusHDvcTFvMPFvMPFvsXIv8bJwcjKxMrMx8vNx8zNyM3NyM/Pyc/Qy8/QxMnKxs7OxszOiY+OcXt+ZHN2WWtvYHF0X3BydIWJgpCRe4mIc3+Ab3x9doF8eoJ7iY2FhoiCh4Z+goN/goN9eHx3jpCKlJSNiIqFkJGKi4mFhYOAh4mJh4qKhoeIh4WEdnp5hYmLe4CFenlxa2hhgX92kIx/d3Vsj4FxhHlud3hygYZ8g4uEh5GHgop9ipCEeH1zfYBybGtdg4VzfoJucXdocXZofH5tenxvf4FwbnBia2tZW19WaGpfampgZGRbZGNaV1tWUVlVTlNORUtGRUtKTVJSUFVURUg/UFRPT1JOSVNUaWxheXtsdnRkV1xURk5LWFxVV1hRZWtga3VuXGFcVFRLWllRWl1ZVFhWPj47WFlTdndrlJmJk5eIhoh9amllaWVcamZeOzouQkQ9Pj44Tkc/WEpDU0pDSkZESElHUldQWVdRWlRMQ0c7QEtAPT4zWVRPY1NHZF1NXllJWFRHTUQ8WT8yUkA5U1BKU1hYQTg1TkA6S0c8SkI9OTUrOTw0P0JAMTMuHigfKjUoMTstNT0wRUpHQ0VBNzMwMzQlJikWMy8fOjYoJi4hHCcZSU5BT09CTUk5T1VGIiscKzAgOjYqPDYsISwgMTw1LjY0ICcgGyQVGCMUHycWGyQXHCcXUlZNRUdJKjApIisgICYWJioYMTgsRUtGLjYuHycbGyITIiYTJSQWHScYGiYYLDYsLzouLjgqMzwvFR8THCYXFh8UGB4ZERwSFB8SEx0TEhoRDRUOERsQEh0QEx0RFCEUOUY6XGdnOkA8KC8lFx8THSQWKDIjO0NENz8/ISwjGyEUICQTISIUJSwmJCwiIyshEh0SDRcPFR4UHykUGyQTFh8RHiYcExoPExoREBgQFB4SFR4TFBwSDBMNDhYNFB0TOkQ9PUZBMDc1HSUYHCETIyYUJy8gLjcpKzQkHScZHSQUISYbJCcdMjo3Mjk1MTcyLDQnIS0aJDIXIS8VHSsUIS0VIikcGB0TGB8SERkPDhYODxgPDhUODxYPDBQMERoOHyofKTEsJC0vHCQiExgRExoPJy8gLzYjNzopNzwrOT4wPUExNDsqKjcfJzMcJjMdIjEZHSwTHCsSHSsSHSoSIC4SIi4UFRgQHyQbDhQOCxIMCxQNChMNEBcSCxELCxMLDxgPFh8ZHykpGSEiHyQfKS4kOD0vQkU1SE0/R0k8PUIwKjUfLjgjIjAXIS8ZIjIXHy8WIC8WHS0TFyUPFiIOGycPIS0RJC4TGyEYERURDRIODhYPEBcRDxYSCA0JBw4IDhUNHRwTIy0tLjg2TlpUSFNMPkZANj04NTo3Njs2LzcoGyYTHywVHCkSGSYRGyoTHi0VGyoTHSwTHiwTGCQOFB8MGiUPHSYPKC0VLjU2GyEfGB8dFh0bGSAZExkTCg8LERYTHSAfJy8vRU1SVV1obHN/goqUm6eraXVxKjIvKTUkIy8dHCYXJTEeIC0XGSURHSsUGSYSHSsTHSkTGiYREhsLGSANKCoRKSwUMi8dKisjMTg2OUE/JSsqFh4VEhsRFh0XHSMiKTAsRk1MOEE/Nj05VFpNbG9eVVpQNDszGicTFR4OFiESGSQTFCAPERsOGCMRGiYSFiIQGCMQHCcSFiEOJSURJCYRIiMQJyURMC4aNTYpODs0NDo2OT07Ki0pMDMrJisjS0xDR0pCRkxEamxcfX5ucHNnTlNJP0Y6LTclIiwbFiERGSUUEyAODxoNEx4OFSEPERsNFiIPHCkRGSQQGhwOFhcLGh0NIiURJSYSNjcla3BnXGJbXWNnNzo4LzAeLzIhSlBEUllPcHRleXxram1iQkY9MTcnJzEhICwbGigVFiQRFCAQEBwNDhkMER0NFCEPER0NERwMFCAOFR8OFRoMExcKEBUKFBcLGx4NMSwVMS4XODgiUFZAUVVLLS0ZLCwbWWJacnVpf4Fyam1fPUA3MDEgLTIdGygUFiIQFSQQFCIODhoLDhoLDhoLDxoLDhgLEh8NEyANDxoKEh0LFhsMEBMJEhcKEhULERUKJSIQJSMPJykTJyoTMC4XKSwUMjEa";

	//Constructor:
	function CubemapGenerator()
	{

	}

	//Function computes the data for the cubemap:
	CubemapGenerator.prototype.computeOutdoorCubemap = function()
	{
	  let base64ToUint8Arrray = function(str)  //decode a base64-encoded data to Uint8Array
	  {
		return new Uint8Array(atob(str).split('').map(function(c)
									   {
										 return c.charCodeAt(0);
									  }));
	  }
	  return [32, 32, new base64ToUint8Arrray(cubemapNegX), base64ToUint8Arrray(cubemapPosX), base64ToUint8Arrray(cubemapNegY), base64ToUint8Arrray(cubemapPosY), base64ToUint8Arrray(cubemapNegZ), base64ToUint8Arrray(cubemapPosZ)];
	};

	const VertexShader=` attribute vec2 inVertexPos;attribute vec2 inTexCoord;uniform mat4 matMVP;varying vec2 texCoord0;void main() { gl_Position=matMVP*vec4(inVertexPos, 0.0, 1.0);texCoord0=inTexCoord;}`;

	const FragmentShader=` precision mediump float;varying vec2 texCoord0;uniform sampler2D colorTex;uniform sampler2D normalTex;uniform sampler2D backgroundMapTex;uniform samplerCube cubemapTex;uniform vec2 inputImageSize;uniform vec4 ambient;uniform vec4 backgroundColor;uniform vec3 directionalLightDir;uniform vec3 directionalLightColor;uniform vec4 fixedMaterialColor;uniform float roughness;uniform float metallic;uniform float indexOfRefraction;uniform float diffusePortion;uniform float environmentReflectance;uniform mat3 matObjSpaceToWorldSpaceRot;
	 #define GAUSS_HSIZE 2
	 vec4 computeCookTorrance( vec4 materialColor, vec4 lightRGBA, bool twoSideLighting, vec3 lightDirection, vec3 normal, vec3 eyeDir, float roughness, float metallic, float indexOfRefraction, float diffusePortion) { vec4 result=vec4(0.0);float NdotL=dot(normal, lightDirection);if (twoSideLighting) NdotL=abs(NdotL);NdotL=clamp(NdotL, 0.0, 1.0);if (NdotL>0.0) { vec3 H=normalize(lightDirection+eyeDir);float NdotH=dot(normal, H);float NdotV=dot(normal, eyeDir);float VdotH=dot(eyeDir, H);NdotH=clamp(NdotH, 0.0, 1.0);NdotV=clamp(NdotV, 0.0, 1.0);VdotH=clamp(VdotH, 0.0, 1.0);vec3 F0=vec3(abs((1.0-indexOfRefraction)/(1.0+indexOfRefraction)));F0=mix(F0*F0, materialColor.xyz, metallic);vec3 fresnel=F0+(vec3(1.0)-F0)*pow(1.0-VdotH, 5.0);float alpha=roughness*roughness;float r1=1.0/(3.14*alpha*alpha*pow(NdotH, 4.0));float r2=(NdotH*NdotH-1.0)/(alpha*NdotH*NdotH);float rough=r1*exp(r2);float NH2=2.0*NdotH;float g1=(NH2*NdotV)/VdotH;float g2=(NH2*NdotL)/VdotH;float geoAtt=min(1.0, min(g1, g2));vec3 specular=max((fresnel*geoAtt*rough)/(NdotL*NdotV*3.14), 0.0);result+=materialColor*lightRGBA*NdotL*diffusePortion+lightRGBA*vec4(specular, 1.0)*(1.0-diffusePortion);}
	 return result;}
	 vec4 computeFragmentColor(vec2 texCoord) { vec4 result;vec4 fsColor=texture2D(colorTex, texCoord);vec4 fsNormal=texture2D(normalTex, texCoord);if(abs(fsNormal.x-0.5)<0.25&&abs(fsNormal.y-0.5)<0.25&&abs(fsNormal.z-0.5)<0.25) result=backgroundColor;
	 else { vec4 materialColor=fixedMaterialColor.w<=0.0? fsColor: fsColor*vec4(1.0-fixedMaterialColor.w)+fixedMaterialColor*vec4(fixedMaterialColor.w);vec3 normal=normalize((texture2D(normalTex, texCoord).xyz)*2.0-1.0);vec3 vsEyeDir=vec3(0.0, 0.0, 1.0);vec3 eyeDir=normalize(vsEyeDir);result=materialColor*ambient;bool twoSideLighting=false;vec3 L=normalize(-directionalLightDir.xyz);normal=matObjSpaceToWorldSpaceRot*normal;result+=computeCookTorrance(materialColor, vec4(directionalLightColor, 1.0), twoSideLighting, L, normal, eyeDir, roughness, metallic, indexOfRefraction, diffusePortion);if(environmentReflectance>0.0) result=mix(result, textureCube(cubemapTex, reflect(-eyeDir, normal)), environmentReflectance);}
	 return result;}
	 #if (GAUSS_HSIZE == 1)
	 float gaussKernel(int index) { if(index==0||index==2||index==6||index==8) return 0.077847;
	 else if(index==1||index==3||index==5||index==7) return 0.123317;
	 else return 0.195346;}
	 #else
	 float gaussKernel(int index) { if(index==0||index==4||index==20||index==24) return 0.003765;
	 else if(index==1||index==3||index==5||index==9||index==15||index==19||index==21||index==23) return 0.015019;
	 else if(index==2||index==10||index==14||index==22) return 0.023792;
	 else if(index==6||index==8||index==16||index==18) return 0.059912;
	 else if(index==7||index==11||index==13||index==17) return 0.094907;
	 else return 0.150342;}
	 #endif
	 vec4 computeGaussianSmoothedFragmentColor() { vec4 result=vec4(0, 0, 0, 1);ivec2 imagePixelPos=ivec2(texCoord0*inputImageSize);for(int offsetY=-GAUSS_HSIZE;offsetY<=GAUSS_HSIZE;++offsetY) for(int offsetX=-GAUSS_HSIZE;offsetX<=GAUSS_HSIZE;++offsetX) { float weight=gaussKernel(offsetX+GAUSS_HSIZE+(offsetY+GAUSS_HSIZE)*(2*GAUSS_HSIZE+1));ivec2 samplePos=imagePixelPos+ivec2(offsetX, offsetY);if(samplePos.x<0||samplePos.x>=int(inputImageSize.x)-1||samplePos.y<0||samplePos.y>=int(inputImageSize.y)) result+=backgroundColor*weight;
	 else result+=computeFragmentColor((vec2(imagePixelPos)+vec2(offsetX, offsetY))/vec2(inputImageSize))*weight;}
	 return vec4(result.xyz, 1.0);}
	 void main() { float backgroundProb=texture2D(backgroundMapTex, texCoord0).r;if(backgroundProb==1.0) discard;
	 else if(backgroundProb>0.0) gl_FragColor=computeGaussianSmoothedFragmentColor();
	 else gl_FragColor=computeFragmentColor(texCoord0);}`;

	//Constructor:
	function HtmlGenerator()
	{
	}

	//Function returns code for style sheet:
	HtmlGenerator.prototype.computeCssCode = function()
	{
	  let code = '\
		canvas.Canvas-Dig-Obj\n\
		{\n\
		  display:block;\n\
		  min-width:50px;\n\
		  width:100%;\n\
		  min-height:50px;\n\
		  height:100%;\n\
		  cursor:grab;\n\
		}\n\
		input.Input-Dig-Obj-Color\n\
		{\n\
		  opacity:0.0;\n\
		  position:relative;\n\
		}\n\
		.Div-Dig-Obj-Icon-Tooltip\n\
		{\n\
		  padding: 4px;\n\
		  border: 0px solid rgba(0,0,0,.8);\n\
		  border-radius: 2px;\n\
		  background-color: rgba(190,190,190,.0);\n\
		  color: #222;\n\
		  font-size:12px;\n\
		  font-weight: normal;\
		  position: absolute;\n\
		  z-index: 2;\n\
		  text-align: left;\n\
		  width: 500px;\n\
		  white-space: nowrap;\n\
		  text-overflow: clip;\n\
		  display: block;\n\
		  overflow: hidden;\n\
		  visibility: hidden;\n\
		}\n';
	  return code;
	}

	//Function returns code for html:
	HtmlGenerator.prototype.computeHtmlCode = function()
	{
	  let code = '<div id="DIV_DIG_OBJ_ICON_TOOLTIP" class="Div-Dig-Obj-Icon-Tooltip"></div><canvas id="CANVAS_DIG_OBJ" class="Canvas-Dig-Obj"></canvas><input id="INPUT_DIG_OBJ_COLOR" type="color" class="Input-Dig-Obj-Color" disabled>\n';
	  return code;
	}
	let iconDataResetView = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAKJSURBVHgB7ZvtcdswDEBfe/1fbxBsUG8QbdBuYG/QbGBv4G7gbOAR7A2cTmB3gqYTqMIpvro5g5RlSYYovTtcEugTAEFSJAIjIyMj92XGwMkL2RQiDJT8TJYMkPydHBhYa8gNWZIQUsi8kFUhe8oo/8Y2/rw1ZPSUCWUU1Yj8RlnTo7TICtlyu9GXWsOMhvlEcwhlE/9Ge/zBKU9Uy+m6oo6d4JQftGf4oZBHnKIR0R69qjFbykh+LeSBfxG1zl/gOOpVjde0UEMeAve65KgpzqlifNUInjvrOz0glvMHrovgKepCD5hDdMJybd72IuqKEJ7VrUkcNdAyfkPiCOGcdztcNUUo+kLiCOGhLnl09mY1fWEAWD1/8r2+IiSe+x8jxzND/1LIkQSIOeCLod+RCDEHWHP6HYkQc4AY+l8MBKsDTGbm9yFyPK95XW9oclXYA1cHLNYHvBp6jylQ653qOuAz/hBDfyRAXQd4XLQUQ38kQMwBO0Of4Y9HQ/8SuijmgJ+G3mMLyAx90AExBHsu8IAfhBY/2qzP4QV+0E9za83iZhbYuz4ehkPBDtKKBpjge0lsSQdrFtvAQ+7ZIQod7VNk+FsWnxDeqBEaZkNH3vb6PkK4CqRLJzwTbpFCSzwFHqyiUWkzHfTez5F3mNEyq8gLtBWBKfGSu0aGvSpUKZBY0owjTvWGseft6ZCqJTIasTX1HCGUhlepPttzh5Ho2iIpPfdURzjl/xfW3+XtmJ6zvfK+d52RxvqENqWznI8xp5ma4KrisqBKCNcRNCXu/7tEaMcRWxxXjV5CKHP0QH2j9doFLXZyXW1wCOUHlW62Tt/+lrPjr2eyo1zG0p+D2YIbGRkZuQt/ARrBWHjSYQHGAAAAAElFTkSuQmCC";

	let iconDataZoomIn = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAI3SURBVHgB7ZmBbYMwEEV/OgEb1N0gG8AGHSHZIN0Ab9Bs0BGSDVAmaDdINkg2SG3FSAGdwYYYDNyTvtSewPDPZ8c2AMMwzIJZIU4SpY3S2kiYmOamdDE6Kp3M37MgUyqU7p46mHsni0A341QiBCbGl9IV/c2Xupo2J4HE64zXJRE5Eu09mSulSu9P9yUm9q10xkSToEvU9tLaVOrR1hbNiYhuOAjYx7zu1QT+JOZeWyUJRISeqakXzdGf3NJ2gUjIYO/5JurXN2GrhAwRQPX+Ge1l75OABPScMHoVCNA9s3G41ycBmszyrC7zy8vYgu59F3wToKEm2l39ojcMxycROyIceyK2rgeGTIAgYiETcCJia4wIVZL1MXnvqWcE6DVBhSHPA6ixu3K4xgeX9irXDDkEomTIBNyI2DvCkbi8w5AJuBCxj9r/K4vQ4bq1yzsMmYA/IpYiHNTP7gUjohchrbOyhS4LoTO6rTqDkaD7JsU3AVvLswRGpsB4m6EDIiBD+O3w3vKMFJFAVYGWRH+kpe0oer9EIMyRmK3nozsS07Qdim482srQfCi6Q6TkaN7YaFO6IjJUq0KYmET7B5UcESMBr52erxZrXldFtGWvkQhnvkDkH0clmks2hf27QZvxFJEj4T5eBR7LWZ2MX1Qnu6uJ/eBR6qOe9Loi4W5+dkiweTbP5sHm2TybnzMSbJ7Ns3mweTbP5ueMBJtn84szn2HB5ku00cWaL3lOwuLMl+RYsHmGmSn/pO1e7Jpru44AAAAASUVORK5CYII";

	let iconDataZoomOut = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAInSURBVHgB7ZmBbYMwEEV/OgEb1N0gG8AGHSHZIN0Ab9Bs0BGSDaJM0G6QbJBskNqKkQCdAQdsDNyTvtSewPDPZ8c2AMMwzIJZIU4SpY3S2kiYmOaudDU6Kp3N37MgUzopPRx1MPdOFoHXjFOJEJgYX0o39Ddf6GbanAQSwxmvSyJyJNp7MldKld5L9yUm9q10wUSToEvU9tLaVOrQ1hbNiYhuOAjYx7zu1QTuJOZeWyUJRISeqakXzdGf3NL2CZGQwd7zQ2GrhAwRQPX+Ba+VvY0E9JwwehUI0D2zwfBklmcNmWhntqB73xfURLurX/SGcHwSsSP8sSdi63ogZAIEEfOZgDMRW2NEqJKsj8lHT5URoNcEFUKeBzyI2KrDNS50aa9yTcghECUhE3AnYu/wR9LlHUIm4ErEPmr/r3qqzLrLO4RMwB8RS+EP6mf3ihHRi5DWWXlALgiz6uxMgnCblK3lWQIjc8J4m6EDIiCD/+3w3vIMn/ONE1QVaEn0R1rajqL3CwT8HInZej66IzFN26HoxqGtDM2HojtESo7mjY02pSsiQ7UqhIlJtH9QyRExEu67PRct1ryuimjLXiPhz/wJkX8clWgu2RT27wZtxlNEjkT38SrwXM7qZPyiOtndTOwHz1If9aS3KxLdzc8OCTbP5tk82DybZ/NzRoLNs3k2DzbP5tn8nJFg82x+ceYzLNh8gTa6WPMF5SQsznxBjgWbZ5iZ8g+j/z8QiQIiVwAAAABJRU5ErkJggg";

	let iconDataFlip = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAqtSURBVHgB7VtZbxvXFT5cJFIUJQ5FyaYkShol3pQulmOkddImptA2aNEErtG+9SFyiwJ9i/vQZ9O/oOl7ALMFCthAW8dN0aciZhHHSVobUtHWS2SZI0cQqc2kqJWSSPUczlzm8nI2SpTsJPqAg5l75s5yzj333OUjAfaxjy81HPA5Qjgcjm5tbZ3B06jT6ZTxXCK9w+HI4vkoCZ5fS6fTCbvP/Fw4AA0fxsMFFJnp0NCKOmg8X1RQYuiI34EFnmoHoOHUylfR2EHRYALpBMPL0PQKyhA6QjF6hxOeUlCro4EjGOpl4+lIgrqS8OesLNQlB44cOHDgR0bvqUcEvIFiGWq1gD7Y5XJdpXPeoAa3s3g4LC12t/lWO1q86wGfd4OuzeRWPAsr625lNtf8IJ1rIR2LDO44rNcl6uEAeoOCMqQddwQKe2zNEUpwrEVJetr9y9/7WmSm2eMuOEnndFbE/lax6CiisZnFfONH49NBcgQZzwRBifKE2B3q5QCGOMpF2IEjOjs7kxS6fDi/dCQ898KzHVkXGu1wYtijGqXCAcUtcJCd5IRCoei4cT/ddvvhbJvghNFUKnWCv6/eDiBkUX6LEoMaQf0eW/8S3/In+9sfv/Jc1zy1usuFDtDqJmdyvptj06G5xbxnY7PobPN78j8Y7EmHA758YQujAT3y8dh08OYn0+3FYhE4R1R0hd1wAIMCqhNs5wfW+iyhHe0K5F57Xp5mhrOISNyZCv1rfDbU7veuPReRFklHOYAc5W1wFclQdECpS/zp44ddyuxis6orOULBKOhn79xNBzAkUM6BRbegSQ4afp1ldjr+fOhYMtTi3eCHwMzyWsPb793vb2lq3PjldweSRs8rGQxbjpW1Tefb793tz28UnCwS8DjEJkvbHQZpBjYM6uTEClEU+tBLwE1kRGDWP8OH/rGuYE40noCt2VR66EB4FkxA97kczq1mb0OBnsU/G+UMq1erA8jwGGdQrIZ7h1Guo5w3uD7IJ77D4dYl0fjMcr5hcm7FR+cet6tIZZI1bF2DZ5ZCvLfdv1I6/8wBUXbdDfYhaQYMwvYho/wG5U0Q8gPN9viPlPyeDf5GFvqs/Md/JiPs/BvPdsyfxv6v90J6VqfUlGfOpC5AeYZdr8UBNDHZifEiFL5A4z71fQJ9bFewOc9fDzZ7N379+vFP3r01Eb6Xyrb+4jsDDyVf4ybYQFtLU9mZ2vRZYmW7DoiB2pd3Choi3wJ1rlABfsanB4qAKzcf9uQ31XC//MGDXnZtUA5lTh0+mAETCBFQ1ttxgAzqdFcEGRMH4z4tghmeBf0PzKKUWyaLwxrfwk2NDYXvD0ZSt8Zng8nZJf+LhzvmAs1qNwlYREIqs+zh3kNOKH+DnSQYBf3sTQuMX4E1EtozqG7WqBKNz3w5nVn28mUa3+WO1tWekH+Vyq1oPJVJqHuACdCZDYJqlJ3YcYDeUBdH+QeYQ0E5C+oawaoutUyCLz+aW2rSq3dAalqj438fZVrBJh6kcn6+TBsn7NzKAZT0ZB39RZN7qJVjKDTnfgdsAj/qGl++O5Vt1Rve+rHFj/e1Ze5NZQPv3p44mJzO+UhGkrMBvfqUOyhp8jp0dvm7rHLAaR1dAoxndXHY5mJocnIy0dvbq4Dm8PXNouuvtyfCPzn1zJRY99Wv98x6G9yFO5OZADmC6cNB31qnVDl63Lg7HRJuV/Bd5Yi0ckBUR6fXqglQW90y1M2AUXARW+cSKydnF/0fjU1LmOGrcscrA52PSWgNQGUP5gjKExUfhWsGsfVBmLxZrQVoaJEEHYX2KFeu64ZIX1/fCJsUMeBSeD5qMNExAjou+P69dAevo0Q7MTHRz+vMHECG642tu7qPKCNoG4sfEgnHuqSFlwc6560mP5QHqOtQ9AiXKIpOKAheaWZMFNSpLw9q+ROwy0AfDIO61qgCOeJQuHU5LPnyQW0eQOuBdHbF8ymOHJg8A5g/9JL7WbS9qvuaOYDG+auCLgHqsLbrQCfQ+8kJEuwM1PLn0Xjdbmo2DOq9WIE9gtZaJ3b4zlLEGhlPMHNAn45OgT2EooKSluWGingryjDeW9XnRdSyGnxiQBvieIhjt6B5CXWNQU1YlFKYK6B20Xew/o6G433s40uEmiY1kUgkWigUSvQ0Sl3o6V0ArV5jgo7Kugs4W0mwu7t7GI27gMbLvJ7bZSFHRLXNxvO4xa2ATXr6ScN0OUw8HZIVI7iPfgmNlPXqCNvNZVYWL8Xx/iQ9A/YWso5OMaps6ACNphoBbrtapKd5ipq/TrBLT+8CZB2d4U6UbhegD6ZlKb+BqEdPS7gVRbTQzMKKJ7e67ka+rkRP8z9cQOdQ97hKDt2jLqE3gzV0QFUSNKOnX0V62ldnenoXoEfVBcFoM1ZUMIKydFEznqennchL/3tivpW2rNLZ1dK+XVhqWh3olhaO94YWa6Wnd4hhUHehGGh2OCLUIcODRg+oyAHaz1Jkvp+/8EzH41NHDmYa3K6tzWLReeXD8cj1O6mDzHgCnV//Xyr8+/fHegsFcDRiXWJqvnU0PMfnCvpAfMcbsHNEQV2qi0tmoy08Q1Q4AD/ygnYs09Onv9I973Y7wY0U9d9GPz2Y4gwX8Xgp7/nzrWQX0dluNPrFI+GM3NGyLCTKGGwfMqhGk/FRnet6yTYBJig7gOhp/pcZJC8f65onw4llHZ2Ya1WQkAALpDIrPmVusYmc4HQ54IfP96Vpv44fIuldUBsYKUvhPWxQRwZ9p5gujMoOMKOn/4J83N//MxUGm8D63X+48SBCjvN53UUzetoGqFXJcIpOs80RPf5Cgcr9yyrwXaBivOfp6fvVO6umoC2pqcyyT32BY8uMnjYB1aFQp10p2UbdYR19DCxQdgBPTxMkf2OZbkKmdgVqBO3dsecxepqbU8gmt1IrvwXG/VwE0e1XdfQK2NimLzuAjfvso7uC/jLB8NNvH5psxEkQ2ATWLbx+sm+alYmeFthfo1COgfrjizfBPs4bPC8ONnaR+AioOIpob1E5OTvAunk9vck7oqAabtXP7SIB5vRdGbwDsvyHZTXGheGlowdsExNfjQRzfFmkp6F6ViZD/UBJ76zdynwXUPgLIj1NpKSdXNDf0bJ0XA5VOMCMntYQp1tBpdAV2B4YKTsEJnN/EXwEJLRjqaxHT//4m/1TIb83b/QwctBrJ/vSot6MnhZAyY8MiIN9xEAdAciBhj/AMAIfAde0Y6msR08T+fizoaMTx3vbqigz+qESJUuRoLSip3WggLoNTgYlwBpkNK0yazKcoWwg0dPAhR+jp8UbyKC7HCXNcHdqoVXMGwQretoECqjRUCsnUBMqWpjoab7M6GlW1n6oFNHj3hZX1xsu3xzv4Z1gh562gTio0RCDbbayGVx8IZfLjUqSRJsh5ZbHXNC8USgCLmpWL38wHkEDPUYPW98suMbSOf+hcGBpVJkLfDg20y5UUR49enQOtgeKmiugDpM8fW5ruDNC1YBsRE+H/J78PK72wAZo0qQTJbr09DYhgzpTpGNNO9siqkKZPhCNr/r1l13jCQb09Lk6GU9QQO0W242mMgy9t1f09JOGafhQd4DPQm07KM3K6tjydYet/qP9YqPif3sWUFBiT2ur86gpgezT0/v44uH/h27QHgWGWhEAAAAASUVORK5CYII";

	let iconDataRule = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAC1SURBVHgB7dpBCoNAEAXRSsj9r6g3MVlmowuZ/rR0PXAvw5RNgyBJKrH9nqPg2VjoRZ2DOsve+81wHgDDfci6027lt8QbYAJknV3nynF8yQQY7glToJQJMFyXKfAvmokJMJxTgOFMgCx3gW5MgCynQDcmQJa7QDcmQJZToBsTIMtdoBsTIMsp0I0JkOUu0I0JkOUU6MYEyHIX6MYEyHIKdGMCZJX++HyHCTCcB0CdnRo7krTIF1hHIvtPOcUQAAAAAElFTkSuQmCC";

	let iconDataMoveLight = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAIeSURBVHgB7ZrhcYMwDIVfO0E3CCNkg3aEbIA3KBvABkknYISMkBHSDdwNGIHiS3oBCrZkMDiHvjv9CVh+lmVh5wwIgiAIgiAIwpJkjenG6saujaXYEAq3gfctw0YwMz4UAI0VeMHy1JZni+t5xcbxDUCCjWIKVYXHmvUpXLXFfDjgUVeMpgKBKDAsugAPPeLnCj4FFvyijAnnBiEb8ZGCR2HRUyEAtcM4UVfopu0neCiCnh1m5uroMEjUR9AOLUH2FAesEPURXDq4GUUmx8JRH6Gy6MgRmHytjltka2tQeKxDMxuUlHu7tytxqyftWazuv5ln6f1dF7mHhlVIGjvCnrZDVoK249whUswsnsAb9JAdQcuIqEjg/lRxTOOJzh97zDv4dhD2iJwEYQb/FJlg1mnIwbeDEGVNoBa8C26ful2rrUlt1diZ6OOIyEhAm7l3oi9N8JcgIkrYxZpNDidt3+A+fAXLgvZ/9v1BpBgWG2LNumpKhWG/XP0dFNyplzHbJPDnw+E7nUF/B1fa/c1om9Ly7hnTuVj8l5iuv0NNNGqnKaajYK8tU/V30ITG/U5th5w5dm4J7HVgqv4OGcFB2mvjFWkm1D589P9DYTitNYbP3DEFwEe/IAiCwGVsv72WLXrPSCGegfdtkXtGlP32WqbBxOdOTo24YY3J54rMD+LlG0x8AvCFeDlhIRTiqgVm7cs+XxAEQRAEQRDo/AI6p9G+Lv+utQAAAABJRU5ErkJggg";

	let iconDataMoveObject = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAIJSURBVHgB7ZvRkZswEIa/ZPKelLAdJB1YnUAHSQe4g6QDSiEdXDogqeDSgcMOpzmfI9syBoS1+mb+B2uMR/uDdheBoVAoFNLRYph60GFQhUE+DeoZDXh++WyKPWPwXg2GEN4G768CwQia+A4BdRjAEQ7ey5E5PvGd0xMZU3M5eK9vZIhw/ewfJ8TsyuIP4oL3+k5GCLcF7yVkQss0AzoyoGZa8KuVxXcsy5dBHwPjPwNjLjD2Z9BvFmRpA85xCIwlmct7jFMMwDhzGuBYp3ZrYq3YEMJYszWx7SKPCZW8WNzL91sSN0var5+2uGsacNw2Cyujd2zP/B9ECgNUPSstC8d4z36uc0tlwLERjgUQXtf5JaU2wKtlpmWh63xP+HJ/BO25Y2+hfuDAT5dFxY20kHTSS6jlRmrit7G2LL2KKyai66eBJBOfI/CGmfYXhbhlsYv8vdCxsbiIeXQs1BxpgD3bNeDphjncRU3YiFQG6OX+lZURxj48tQE6h6TPEYTX/LCmAR0b2zqvB32O/O49BggzrvOyKYpxigEY5wPLIsRnahcY+zvoFw+M475+viIDtF5PCb4lE4RpBggZcdoyX1NWb4go2qvHbq/1ZPrSpD5LMJP4znHpmYI/+1njuGzADgN0ZF72riGEE6JgiIa3wTcY47gs9hj8x4hSY6DsXcNM4isUCoVN8g8JSYiAjKqhmwAAAABJRU5ErkJggg";

	let iconDataRotateLeft = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAANjSURBVHgB7ZvhddowEMf/7cv3uhPkMkG6QbxBsgHeoN0AOkHaCWgm4GUCpxPABnYngE6Q6J6thxAnWRhssPDvvXsBWci600m6kx1gZGRk5Ir5hH4hJamS+/pvYkip5A4RwsrNlBRK3j1SIDJSJTn8SpuyRiSQkgXCFTdl8PxANZLvLWXQ/EJ7xQdtAF7klghXMlfyrORRyW39+8ESqjxPiykqhaMiRHlWfNCj7KJpzhdKviFSMviVnyPSUWcI/qhujshhBV3KLxA5BP+cj9btNb7RJ0QOwb/VRQ9Hby7XJ1wBrpU/+lWfIUQ69z8H1ksd5StUR1mDJdQA947yNwycUAO4Yvo3DJxQA5Cj/B+uBNcCOPjI78b6nip5QDjfhbKfGDA8osccahaIAD7ZbWuACSIhx+HKR5UKEw6fCoTIOGQqTBEpIVOhQMRwBHh1rm/D7h2t64e8IKGf/pBVXsL9QkOKKoHSOcSmrv+Kw7LHFFVgRsY9/yIsB+F+T+o+8O9ecETmmmJ/9B8c9ZrWDb5OaL5fAf+642uDlbZ3sTXcaX0Q5pHYXLg+Q/iusYY7w3w6sg3C1nhF3dfC+E3r/CWpG5KsTw0ddY1i4ul82zYy4ZoZ4kv5SzA8OhOhfC507tnoAEF+kDoJaGdqXJ8K122FdB07Ml2gw4XbVq4Q6iSQjWRij74UXufYX1NMMmy9huoyMtqWBvBobgWRsA0wN65JBpLcVTqeT6x2tLJshBxb95emTG8Q/O6dImynyYR6t8K9bG/i73uL5g36IxPKXozPoSNTCmWE3eM5rsMxCr+Go+MAjkE29g+7MgDf1HTfFPs7xwy7ynThmq+1OOnKAKxM5rjGozBT8hsXQOip8CnZQHDFc9GVAXTsr8WElPzBhTxT7MoA/MjszpCvqNzeJMMFnCH2NQXYI/i4fGWVZ1ad3ul7DbANkBqfS6G+tDOQUPYfLTmFAQjbJEmLy7V9W10plEnZnh0cseescEakEHaJsExvadXJ4c8pEoTlC71jd1x3nj0hRRUUFWiO9TOhDiv4VIuUUT7iApBOYJrElZjkB7RxUQ9j2AjSKEsinTFqKLAdXxtng7B7BGULj+40oJ2krie1o1+9P0nu0OW/zbFHfKk/8zZVot1eb7ZT4opeyhgZ6YEPz4ZhJtRiQKsAAAAASUVORK5CYII";

	let iconDataRotateRight = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAANzSURBVHgB7ZvxcZswFMa/9vp/3QnyMkGzQdgg3sBs4G6AO4GvE5BM4MsEJBMkG0AncDpByzvgkOUneIBrG8Hv7l2MJMvo40l6EgowMzMzM2E+4bxQbm+5LYy0rLT30l7Lay+h3P4qLM1tW5b3CoJOANNieCQEobsAXglB6C9A1TVWGDGEYQJUtsWIWVif73J7QNEoniG0ItiziTcQiv7O7j5ZERjKLYJOBK8htHvDqMcEDezmOzSL8AMT4BFuAfbwMHKUeIRbhB0mAHeHpjEhwATg2MElQIKJEMEtgrexgQk3kgc+SYAIE8HlBSkmAsHdDW40FXzGuMlye3HkBVAwdgGYd0f6HRT4IMCrIz2AAp89QDUV+iDAhyNdJcAXjIsgt3tlWRZAige4y7xgpDQFPxrj+IAwcnjd31eAFTwhQffGe7VUJnTvCgTP6NIVIniKpiuk8JimjRFvXd+G3bu362sOSAS5fUe9uODIK8vtGd0OMgQoghgqrzPogxKe/1flPfD3nlD/Nue94fhJc/4tBhCgvY8laHcxridF/+CEG22P+HscLnYCod57DGAD/Qi7h3vpuRxYB6EWj//GxjV/x4z3t0Z9MQZALTfqeoqLhpvvW0co5Jnh8NooW22Xt3lUK7Fwc1vjBgjya+yVop7IyI+E/LVVR1XGjuJ2kAe5JU4Q7tqNS4UyC8gimdhPXwpFExyPKSYhaq+hMo2Mugc3VuJGMAlbgNjIkwRaC3VshXL2AYqqsSxCgtr9pS5zNgjN7h1ANyqHQrkb4bdsb+Jr1Z5fG303REIh7cn4rH0ymZBGuf22yvB8zsdoqjiAYxDXTlAnNALwj5ruG+B4lN3gsDH/wzWfSzspGgG4MaEjj5/CJrdfGClDN0U/cCJXvBQaAarYvzITQnFgIcZI0QjA++63hn1D4fYmIUa639anC7BH/MTxC4nQKjMKhowBtgCB8TkTykszAwlpf3BGbAEI9YKiMpdrN011mZAmBS52cMSe43rVdRakEFY6jko4js7sE5sJmtcU0mGnq9i6tm+8unn2hABFUJSiPdYPhTLcwGVp0oryAVeAtAPTZq6FSdKhjqt6ccEiSE9ZMmk/roKU9TTVcTEIzcfW+elGinqqt7RSPfsy72LLWu2/zbFHfC0/8zSVod9cb9aT4XDVNzMzc37+AZPdZ0kH25LPAAAAAElFTkSuQmCC";

	let iconDataSelectColor = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAGWSURBVHgB7ZnNbYNAEIUftmVHOSUlpARXYDqBc5rAVeScVIJTgdNBSnBOuRKQODiE/RlgRpH3fdJItmD5hoED2gcQQgghhPjJ26rburTVTKxufWHokzqdHGc2MayjsS/G6aRUaKar3Njnc3qplZqpjX1OZwY/DXT4ausRdj6nUzyA1/0+uGh4gfJ8HjuUOU7/zak/M3OcmV39v/59QJRzAyHb1Qqm7KCKeADrTPL8F0DcofLljW9fXWj8Pv8/OAAkDgeAxOEAkDgcABIn9J3V7cg8wM6t6Rt1ht6AD+hwgq3P5/SSQ2dzojD2+ZxBqoUbqYx9Mc4gJeZtV1369Qcj3xQnIYQQFzmYDS5WR2NfjNNJqdBMV7mxz+f0Uis1Uxv7nE5mg4FFfxq6Lz7bVYK0omnw/fY0diQqG3x/kel6JQ7PiHLKk6HNHWTMe6i7LcQ0AqU8eVsph3UD1sp7VhPuxjYdzJgN6sIBIHE4ACQOB4DE4QCQOMwGAwuYDUJnc6Iw9vmcQaqFG6mMfTHOICWYDRJCyO3xAy0MZiDZGUF/AAAAAElFTkSuQmCC";

	//Constructor:
	function IconRenderer(canvas)
	{
	  //Store GL-Context:
	  this.glContext = canvas.getContext("webgl", {premultipliedAlpha: false});
	  let gl = this.glContext;
	  //No valid context avail:
	  if(!gl)
		throw 'IconRenderer(..): Initialization of WebGL failed!\nPlease use a web browser with WebGL-Support!';
	  //Init var(s):
	  this.icons = [];
	  this.iconsBoundingBox = [0, 0, 0, 0];  //[MinX, MaxX, MinY, MaxY]
	  this.colorButton = [255, 87, 36]; // 255 87 36
	  let VSProgramText = `
	  attribute vec2 inVertexPos;
	  attribute vec2 inTexCoord0;
	  attribute vec2 inTexCoord1;
	  uniform mat4 matMVP;          //ModelviewProjection-Matrix
	  varying vec2 texCoord0;
	  varying vec2 texCoord1;
	  void main()
	  {
		gl_Position = matMVP * vec4(inVertexPos, 0.0, 1.0);
		texCoord0 = inTexCoord0;
		texCoord1 = inTexCoord1;
	  }`;
	  let FSProgramText = `
	  precision mediump float;
	  varying vec2 texCoord0;
	  varying vec2 texCoord1;
	  uniform sampler2D buttonBackgroundTex;  //Button background texture with custom color
	  uniform sampler2D colorTex;             //Icon image content
	  uniform vec4 colorIntensifier;
	  void main()
	  {
		vec4 col = texture2D(buttonBackgroundTex, texCoord0);
		if(col.a == 0.0)
		   discard;
		vec4 contentCol = texture2D(colorTex, texCoord1);    
		col = vec4(col.rgb * vec3(1.0 - contentCol.a) + contentCol.rgb * vec3(contentCol.a), 0.9);
		col.rgb += colorIntensifier.rgb;
		gl_FragColor = col;
	  }`;
	  //Load shader program:
	  this.program = new GLProgram(gl, VSProgramText, FSProgramText);
	  //Bind shader variables:
	  this.shaderLocInVertexPos = gl.getAttribLocation(this.program.glID, "inVertexPos");
	  this.shaderLocInTexCoord0 = gl.getAttribLocation(this.program.glID, "inTexCoord0");
	  this.shaderLocInTexCoord1 = gl.getAttribLocation(this.program.glID, "inTexCoord1");
	  this.shaderLocMatMVP = gl.getUniformLocation(this.program.glID, "matMVP");
	  this.shaderLocButtonBackgroundTex = gl.getUniformLocation(this.program.glID, "buttonBackgroundTex");
	  this.shaderLocColorTex = gl.getUniformLocation(this.program.glID, "colorTex");
	  this.shaderLocColorIntensifier = gl.getUniformLocation(this.program.glID, "colorIntensifier");
	  //Create VBO for geometry data:
	  this.vbo = new GLVBO(gl);
	  //Init var(s):
	  this.hitIconIndex = -1;
	  this.hitIconTime = (new Date()).getTime();
	  this.iconScale = 1.0;
	  this.textureButtonBackground = {valid: false, texObject: null};
	  //Init function(s);
	  this.isGuiCompletelyVisible = function()
	  {
		return (gl.canvas.width < this.iconScale * this.iconsBoundingBox[1] || 
				gl.canvas.height < this.iconScale * this.iconsBoundingBox[3] + 100)? false: true; //Vertical: At least 100px more so object remains visible
	  };
	}

	//Function adds icons:
	IconRenderer.prototype.addIcons = function(icons)
	{
	  let nIcons = icons.length;
	  for(let n = 0; n < nIcons; ++n)
	  {
		//Check for equal size of all icons:
		if (this.icons.length > 0 && (this.icons[0].imageActive.width != icons[n].imgActive.width || this.icons[0].imageActive.height != icons[n].imgActive.height ||
			this.icons[0].imageActive.width != icons[n].imgInactive.width || this.icons[0].imageActive.height != icons[n].imgInactive.height))
		  throw 'IconRenderer::addIcons(..): All icons must have the same size!';
		//Add icon to list:
		this.icons.push({ id: icons[n].id, active: 1, imageActive: icons[n].imgActive, imageInactive: icons[n].imgInactive, x: 10 + this.icons.length * (icons[n].imgActive.width * 1.1), y: 10, w: 64, h: 64, animateClicked: icons[n].animateClicked });
	  }
	  //Special position arrangement for 6 items:
	  if (this.icons.length == 6)
	  {
		let x = 10, y = 10;
		for (let i = 0; i < this.icons.length; ++i)
		{
		  this.icons[i].x = x;
		  this.icons[i].y = y;
		  if (i == 0 || i == 1 || i == 3)
			x += (icons[i].imgActive.width * 1.25)
		  else
			x = 10;
		  if(i == 2 ||i == 4)
			y += (icons[i].imgActive.height * 1.25)
		}
	  }
	  //Arrange all icons at the bottom line:
	  else
		for (let i = 0; i < this.icons.length; ++i)
		{
		  this.icons[i].x = 20 + i * (icons[i].imgActive.width * 1.25);
		  this.icons[i].y = 20;
		}
	  //Update bounding box:
	  this.iconsBoundingBox = [9999, 0, 9999, 0];
	  for (let i = 0; i < this.icons.length; ++i)
	  {
		this.iconsBoundingBox[0] = Math.min(this.iconsBoundingBox[0], this.icons[i].x);
		this.iconsBoundingBox[1] = Math.max(this.iconsBoundingBox[1], this.icons[i].x + icons[i].imgActive.width);
		this.iconsBoundingBox[2] = Math.min(this.iconsBoundingBox[2], this.icons[i].y);
		this.iconsBoundingBox[3] = Math.max(this.iconsBoundingBox[3], this.icons[i].y + icons[i].imgActive.height);
	  }
	  //Create GL-Resources:
	  this.createIconTexture2D();
	  this.updateVBO();
	}

	//Function clears data:
	IconRenderer.prototype.clearData = function()
	{
	  this.icons = [];
	  //NOTE: No need for clearing textures here
	}

	//Function creates texture for button background:
	IconRenderer.prototype.createButtonBackgroundTexture2D = function(red, green, blue)
	{
	  try
	  {
		//Generate texture data:
		let texData = { width: 64, height: 64, data: null };
		const nBytesPerScanline = texData.width * 4;
		const nTotalBytes = texData.height * nBytesPerScanline;
		let i = new Uint8ClampedArray(nTotalBytes);
		const roundedBoxDistanceFunction = function(boxCenter2D, boxSize2D, radius)
		{
		  const v = [Math.max(Math.abs(boxCenter2D[0]) - boxSize2D[0] + radius, 0.0), Math.max(Math.abs(boxCenter2D[1]) - boxSize2D[1] + radius, 0.0)];
		  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
		  return len - radius;
		}
		const smoothstepFunction = function(edge0, edge1, x)
		{
		  let t = (x - edge0) / (edge1 - edge0);
		  t = t < 0.0? 0.0: (t > 1.0? 1.0: t);
		  return t * t * (3.0 - 2.0 * t);
		}
		const boxSize = [texData.width - 1, texData.height - 1];
		const edgeSoftness = 1.5;
		const radius = 15.0;
		for (let n = 0; n < nTotalBytes; n += 4)
		{
		  const x = (n % nBytesPerScanline) / 4, y = Math.floor(n / nBytesPerScanline);
		  const distance = roundedBoxDistanceFunction([x - 0.5 * boxSize[0], y - 0.5 * boxSize[1]], [0.5 * boxSize[0], 0.5 * boxSize[1]], radius);
		  const smoothedAlpha =  1.0 - smoothstepFunction(0.0, edgeSoftness * 2.0, distance); 
		  i[n] = red;
		  i[n + 1] = green;
		  i[n + 2] = blue;
		  i[n + 3] = 255.0 * smoothedAlpha;
		}
		texData.data = i;
		//build texture:
		let gl = this.glContext;
		if(this.textureButtonBackground.texObject != null)  //already existing, update texture
		  this.textureButtonBackground.texObject.updateTextureFromUint8ClampedArray(texData.width, texData.height, texData.data);
		else
		  this.textureButtonBackground.texObject = new GLTexture(gl, texData.width, texData.height, texData.data, gl.TEXTURE_2D, gl.RGBA, gl.RGBA, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);  //NOTE: null is not accepted in texImage2D(..), so default image data is used  
		this.textureButtonBackground.valid = true;
	  }
	  catch(err)
	  {
		this.textureButtonBackground = null;  //prevents it from loading it again every frame
	  }
	}

	//Function create texture:
	IconRenderer.prototype.createIconTexture2D = function()
	{
	  let gl = this.glContext;
	  let nIcons = this.icons.length;
	  let texHeight = this.icons[0].h;
	  let texWidth = this.icons[0].w * nIcons * 2;
	  //console.log("createIconTexture2D(..): Create icon texture with " + texWidth + " x " + texHeight + " pixel.");
	  let IData = new Uint8Array(texWidth * texHeight * 4);
	  for (let i = 0; i < texWidth * texHeight * 4; ++i)
		IData[i] = i % 4 == 3 ? 0 : 127;
	  this.texture = new GLTexture(gl, texWidth, texHeight, IData, gl.TEXTURE_2D, gl.RGBA, gl.RGBA, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);  //NOTE: null is not accepted in texImage2D(..), so default image data is used  
	  for (let n = 0; n < nIcons; ++n)  //partial update of the texture by loading the icon images
	  {
		let xoffset = this.icons[0].w * n * 2;
		let yoffset = 0;
		//console.log("createIconTexture2D(..): Uploading texture with " + this.icons[n].image.width + " x " + this.icons[n].image.height + " pixel.");
		this.texture.updatePartialTexture(xoffset, yoffset, this.icons[n].imageActive);
		xoffset += this.icons[0].w;
		this.texture.updatePartialTexture(xoffset, yoffset, this.icons[n].imageInactive);
	  }
	}

	//Function returns tooltip text of a specific icon (empty string if iconID is invalid):
	IconRenderer.prototype.getIconToolTipText = function(iconID)
	{
	  if(iconID == "IconFlip")
		return "Show other object side.";
	  else if(iconID == "IconMoveObjectOrLight")
		return "Toggle manipulation of light or object position.";
	  else if(iconID == "IconResetView")
		return "Reset view, light direction an object color.";
	  else if(iconID == "IconRule")
		return "Toggle visualization of scale.";
	  else if(iconID == "IconZoomIn")
		return "Zoom in.";
	  else if(iconID == "IconZoomOut")
		return "Zoom out.";
	  else if(iconID == "IconRotateLeft")
		return "Counter-clockwise object rotation.";
	  else if(iconID == "IconRotateRight")
		return "Clockwise object rotation.";
	  else if(iconID == "IconSelectColor")
		return "Choose custom color for the object.";
	  else
	  {
		console.log("IconRenderer::getIconToolTipText(..): Tooltip text for '" + iconID + "' is not avail!");
		return "";
	  }
	}

	//Function returns id of hitted icon (empty string if nothing was hit):
	IconRenderer.prototype.hitIcon = function(x, y, iconClicked)
	{
	  if(!this.isGuiCompletelyVisible())
		return "";
	  for (let n = 0; n < this.icons.length; ++n)
	  {
		let icon = this.icons[n];
		if(x >= this.iconScale * icon.x && x <= this.iconScale * (icon.x + icon.w) && y >= this.iconScale * icon.y && y <= this.iconScale * (icon.y + icon.h))
		{
		  //console.log("hitIcon(..): Hitted \"" + icon.id + "\" at position {" + x + ", " + y + "}");
		  if(iconClicked)
		  {
			this.icons[n].active = this.icons[n].active == 0 ? 1 : 0;
			this.updateVBO();
			if(this.icons[n].animateClicked)
			{
			  this.hitIconIndex = n;
			  this.hitIconTime = (new Date()).getTime();
			}
			else
			  this.hitIconIndex = -1;
		  }
		  return icon.id;
		}
	  }
	  return "";
	}

	//Function renders a frame:
	IconRenderer.prototype.render = function()
	{
	  if(this.icons.length == 0 || !this.isGuiCompletelyVisible() || !this.textureButtonBackground)
		return;
	  //Create/Update button texture:
	  if(!this.textureButtonBackground.valid)
		this.createButtonBackgroundTexture2D(this.colorButton[0], this.colorButton[1], this.colorButton[2]);
	  if(!this.textureButtonBackground) //Error while creating the texture, don't try to update it again and show no icons
		return;
	  //Setup rendering:
	  let gl = this.glContext;
	  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	  gl.enable(gl.DEPTH_TEST);
	  gl.depthFunc(gl.LEQUAL);
	  //Bind shader and textures:
	  this.program.bind();
	  gl.uniform1i(this.shaderLocColorTex, 0);
	  gl.activeTexture(gl.TEXTURE0);
	  this.texture.bind();
	  gl.uniform1i(this.shaderLocButtonBackgroundTex, 1);
	  gl.activeTexture(gl.TEXTURE1);
	  this.textureButtonBackground.texObject.bind();
	  //Set parameter(s):
	  let matProj = new Matrix4f();
	  let left = 0.0, right = (1.0 / this.iconScale) * gl.canvas.width, bottom = 0.0, top = (1.0 / this.iconScale) * gl.canvas.height, near = -1.0, far = 1.0;
	  matProj.setOrtho(left, right, bottom, top, near, far);
	  gl.uniformMatrix4fv(this.shaderLocMatMVP, false, matProj.data); //NOTE: There is no modelview matrix necessary here, we can take the projection matrix directly
	  //Set geometry data:
	  let size = 2;          //2 components per vertex
	  let type = gl.FLOAT;   //32-Bit floats
	  let normalize = false; //no data normalization
	  let stride = 6 * 4;    //stride to next element (number of bytes)
	  let offset = 0;        //start of buffer data
	  this.vbo.bind();
	  gl.vertexAttribPointer(this.shaderLocInVertexPos, size, type, normalize, stride, offset);
	  gl.enableVertexAttribArray(this.shaderLocInVertexPos);
	  offset = 8;
	  gl.vertexAttribPointer(this.shaderLocInTexCoord0, size, type, normalize, stride, offset);
	  gl.enableVertexAttribArray(this.shaderLocInTexCoord0);
	  offset = 16;
	  gl.vertexAttribPointer(this.shaderLocInTexCoord1, size, type, normalize, stride, offset);
	  gl.enableVertexAttribArray(this.shaderLocInTexCoord1);
	  //Enable blending:
	  gl.enable(gl.BLEND);
	  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	  //Draw the geometry:
	  let primitiveType = gl.TRIANGLES;
	  offset = 0;
	  let nIcons = this.icons.length;
	  let count = nIcons * 6;
	  if(this.hitIconIndex >= 0 && this.hitIconIndex < nIcons)
	  {
		//draw active icon:
		let timeSinceClicked = ((new Date()).getTime() - this.hitIconTime) * 0.001;  //seconds
		let blendFactor = 1.0 - (timeSinceClicked < 0.9? timeSinceClicked / 0.9: 1.0);  //1.0 -> 0.0
		let intensifierColor = [0.25, 0.25, 0.25];
		gl.uniform4f(this.shaderLocColorIntensifier, intensifierColor[0] * blendFactor, intensifierColor[1] * blendFactor, intensifierColor[2] * blendFactor, 1.0);
		offset = this.hitIconIndex * 6;
		gl.drawArrays(primitiveType, offset, 6);
		//draw inactive icon(s) before and after the active icon:
		gl.uniform4f(this.shaderLocColorIntensifier, 0.0, 0.0, 0.0, 1.0);
		if(this.hitIconIndex > 0)
		  gl.drawArrays(primitiveType, 0, this.hitIconIndex * 6);
		if(this.hitIconIndex < nIcons)
		  gl.drawArrays(primitiveType, this.hitIconIndex * 6 + 6, (nIcons - this.hitIconIndex - 1) * 6);
	  }
	  else
	  {
		gl.uniform4f(this.shaderLocColorIntensifier, 0.0, 0.0, 0.0, 1.0);
		gl.drawArrays(primitiveType, offset, count);
	  }
	  //Reset state(s):
	  gl.activeTexture(gl.TEXTURE0);
	  gl.disable(gl.BLEND);
	};

	//Function updates colors (e.g. when switching from light to dark theme):
	IconRenderer.prototype.updateTheme = function(buttonColorRGB)
	{
	  this.colorButton = [buttonColorRGB[0], buttonColorRGB[1], buttonColorRGB[2]];
	  if(this.textureButtonBackground)
		this.textureButtonBackground.valid = false;
	}

	//Function updates VBO with geometry for all icons:
	IconRenderer.prototype.updateVBO = function()
	{
	  let nIcons = this.icons? this.icons.length: 0;
	  if(nIcons == 0)
		return;
	  let data = [];
	  let deltaTX = 1.0 / nIcons / 2;
	  for (let n = 0; n < nIcons; ++n)
	  {
		let minX = this.icons[n].x;
		let maxX = minX + this.icons[n].w;
		let minY = this.icons[n].y;
		let maxY = minY + this.icons[n].h;
		let minU = deltaTX * n * 2;
		if (this.icons[n].active == 0)
		  minU += deltaTX;
		let maxU = minU + deltaTX;
		data.push(...[   minX, minY, 0.0, 1.0, minU, 1.0,        //PosX, PosY, TexCoord0X, TexCoord0Y, TexCoord1X, TexCoord1Y
						 minX, maxY, 0.0, 0.0, minU, 0.0,
						 maxX, minY, 1.0, 1.0, maxU, 1.0,
						 minX, maxY, 0.0, 0.0, minU, 0.0,
						 maxX, maxY, 1.0, 0.0, maxU, 0.0,
						 maxX, minY, 1.0, 1.0, maxU, 1.0]);
	  }
	  this.vbo.update(new Float32Array(data));
	}

	let MATRIX4F_ARRAY_T = typeof Float32Array !== "undefined"? Float32Array: Array;     //Data type of the array
	let MATRIX4F_VALUE_COUNT = 16;                                                       //Number of data values

	//Standard constructor:
	function Matrix4f()
	{
	  this.data = new MATRIX4F_ARRAY_T(MATRIX4F_VALUE_COUNT);
	  for (let n = 0; n < MATRIX4F_VALUE_COUNT; ++n)
		this.data[n] = 0.0;
	}

	//Constructor with parameter:
	function Matrix4f(val0, val1, val2, val3, val4, val5, val6, val7, val8, val9, val10, val11, val12, val13, val14, val15)
	{
	  this.data = new MATRIX4F_ARRAY_T(MATRIX4F_VALUE_COUNT);
	  this.data[0] = val0;
	  this.data[1] = val1;
	  this.data[2] = val2;
	  this.data[3] = val3;
	  this.data[4] = val4;
	  this.data[5] = val5;
	  this.data[6] = val6;
	  this.data[7] = val7;
	  this.data[8] = val8;
	  this.data[9] = val9;
	  this.data[10] = val10;
	  this.data[11] = val11;
	  this.data[12] = val12;
	  this.data[13] = val13;
	  this.data[14] = val14;
	  this.data[15] = val15;
	}

	//Function returns cloned matrix:
	Matrix4f.prototype.clone = function()
	{
	  let result = new Matrix4f();
	  for (let n = 0; n < MATRIX4F_VALUE_COUNT; ++n)
		result.data[n] = this.data[n];
	  return result;
	}

	//Function inverts current matrix:
	Matrix4f.prototype.invert = function()
	{
	  let a00 = this.data[0], a01 = this.data[1], a02 = this.data[2], a03 = this.data[3];
	  let a10 = this.data[4], a11 = this.data[5], a12 = this.data[6], a13 = this.data[7];
	  let a20 = this.data[8], a21 = this.data[9], a22 = this.data[10], a23 = this.data[11];
	  let a30 = this.data[12], a31 = this.data[13], a32 = this.data[14], a33 = this.data[15];
	  let b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
	  let b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
	  let b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
	  let d = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	  if (!d) //can't compute inverted matrix
	  {
		console.log("Matrix4f::invert(): Determinant is zero!");
		return;
	  }
	  d = 1.0 / d;
	  this.data[0] = (a11 * b11 - a12 * b10 + a13 * b09) * d;
	  this.data[1] = (a02 * b10 - a01 * b11 - a03 * b09) * d;
	  this.data[2] = (a31 * b05 - a32 * b04 + a33 * b03) * d;
	  this.data[3] = (a22 * b04 - a21 * b05 - a23 * b03) * d;
	  this.data[4] = (a12 * b08 - a10 * b11 - a13 * b07) * d;
	  this.data[5] = (a00 * b11 - a02 * b08 + a03 * b07) * d;
	  this.data[6] = (a32 * b02 - a30 * b05 - a33 * b01) * d;
	  this.data[7] = (a20 * b05 - a22 * b02 + a23 * b01) * d;
	  this.data[8] = (a10 * b10 - a11 * b08 + a13 * b06) * d;
	  this.data[9] = (a01 * b08 - a00 * b10 - a03 * b06) * d;
	  this.data[10] = (a30 * b04 - a31 * b02 + a33 * b00) * d;
	  this.data[11] = (a21 * b02 - a20 * b04 - a23 * b00) * d;
	  this.data[12] = (a11 * b07 - a10 * b09 - a12 * b06) * d;
	  this.data[13] = (a00 * b09 - a01 * b07 + a02 * b06) * d;
	  this.data[14] = (a31 * b01 - a30 * b03 - a32 * b00) * d;
	  this.data[15] = (a20 * b03 - a21 * b01 + a22 * b00) * d;
	}

	//Function multiplies matrix to current matrix:
	Matrix4f.prototype.multiply = function(matRight)
	{
	  //Backup current values:
	  let v00 =  this.data[0], v01 =  this.data[1], v02 =  this.data[2], v03 =  this.data[3];
	  let v10 =  this.data[4], v11 =  this.data[5], v12 =  this.data[6], v13 =  this.data[7];
	  let v20 =  this.data[8], v21 =  this.data[9], v22 = this.data[10], v23 = this.data[11];
	  let v30 = this.data[12], v31 = this.data[13], v32 = this.data[14], v33 = this.data[15];
	  //Compute row 1:
	  let mr0 = matRight.data[0], mr1 = matRight.data[1], mr2 = matRight.data[2], mr3 = matRight.data[3];
	  this.data[0] = mr0 * v00 + mr1 * v10 + mr2 * v20 + mr3 * v30;
	  this.data[1] = mr0 * v01 + mr1 * v11 + mr2 * v21 + mr3 * v31;
	  this.data[2] = mr0 * v02 + mr1 * v12 + mr2 * v22 + mr3 * v32;
	  this.data[3] = mr0 * v03 + mr1 * v13 + mr2 * v23 + mr3 * v33;
	  //Compute row 2:
	  let mr4 = matRight.data[4], mr5 = matRight.data[5], mr6 = matRight.data[6], mr7 = matRight.data[7];
	  this.data[4] = mr4 * v00 + mr5 * v10 + mr6 * v20 + mr7 * v30;
	  this.data[5] = mr4 * v01 + mr5 * v11 + mr6 * v21 + mr7 * v31;
	  this.data[6] = mr4 * v02 + mr5 * v12 + mr6 * v22 + mr7 * v32;
	  this.data[7] = mr4 * v03 + mr5 * v13 + mr6 * v23 + mr7 * v33;
	  //Compute row 3:
	  let mr8 = matRight.data[8], mr9 = matRight.data[9], mr10 = matRight.data[10], mr11 = matRight.data[11];
	  this.data[8]  = mr8 * v00 + mr9 * v10 + mr10 * v20 + mr11 * v30;
	  this.data[9]  = mr8 * v01 + mr9 * v11 + mr10 * v21 + mr11 * v31;
	  this.data[10] = mr8 * v02 + mr9 * v12 + mr10 * v22 + mr11 * v32;
	  this.data[11] = mr8 * v03 + mr9 * v13 + mr10 * v23 + mr11 * v33;
	  //Compute row 4:
	  let mr12 = matRight.data[12], mr13 = matRight.data[13], mr14 = matRight.data[14], mr15 = matRight.data[15];
	  this.data[12] = mr12 * v00 + mr13 * v10 + mr14 * v20 + mr15 * v30;
	  this.data[13] = mr12 * v01 + mr13 * v11 + mr14 * v21 + mr15 * v31;
	  this.data[14] = mr12 * v02 + mr13 * v12 + mr14 * v22 + mr15 * v32;
	  this.data[15] = mr12 * v03 + mr13 * v13 + mr14 * v23 + mr15 * v33;
	}

	//Function computes multiplication of matrix and vector:
	Matrix4f.prototype.multipliedByVector4f = function(x, y, z, w)
	{
	  let result = [this.data[0] * x + this.data[4] * y + this.data[8] * z + this.data[12] * w,
					this.data[1] * x + this.data[5] * y + this.data[9] * z + this.data[13] * w,
					this.data[2] * x + this.data[6] * y + this.data[10] * z + this.data[14] * w,
					this.data[3] * x + this.data[7] * y + this.data[11] * z + this.data[15] * w];
	  return result;
	}

	//Function sets identity matrix:
	Matrix4f.prototype.setIdentity = function()
	{
	  this.data[0] = 1.0;
	  this.data[1] = 0.0;
	  this.data[2] = 0.0;
	  this.data[3] = 0.0;
	  this.data[4] = 0.0;
	  this.data[5] = 1.0;
	  this.data[6] = 0.0;
	  this.data[7] = 0.0;
	  this.data[8] = 0.0;
	  this.data[9] = 0.0;
	  this.data[10] = 1.0;
	  this.data[11] = 0.0;
	  this.data[12] = 0.0;
	  this.data[13] = 0.0;
	  this.data[14] = 0.0;
	  this.data[15] = 1.0;
	}

	//Function sets orthographic projection matrix:
	Matrix4f.prototype.setOrtho = function(left, right, bottom, top, near, far)
	{
	  let idx = 1.0 / (left - right);
	  let idy = 1.0 / (bottom - top);
	  let idz = 1.0 / (near - far);
	  this.data[0] = -2.0 * idx;
	  this.data[1] = 0.0;
	  this.data[2] = 0.0;
	  this.data[3] = 0.0;
	  this.data[4] = 0.0;
	  this.data[5] = -2.0 * idy;
	  this.data[6] = 0.0;
	  this.data[7] = 0.0;
	  this.data[8] = 0.0;
	  this.data[9] = 0.0;
	  this.data[10] = 2.0 * idz;
	  this.data[11] = 0.0;
	  this.data[12] = (left + right) * idx;
	  this.data[13] = (top + bottom) * idy;
	  this.data[14] = (far + near) * idz;
	  this.data[15] = 1.0;
	}

	//Function transposes current matrix:
	Matrix4f.prototype.transpose = function()
	{
	  let temp = this.data[1];
	  this.data[1] = this.data[4];
	  this.data[4] = temp;
	  temp = this.data[2];
	  this.data[2] = this.data[8];
	  this.data[8] = temp;
	  temp = this.data[3];
	  this.data[3] = this.data[12];
	  this.data[12] = temp;
	  temp = this.data[6];
	  this.data[6] = this.data[9];
	  this.data[9] = temp;
	  temp = this.data[7];
	  this.data[7] = this.data[13];
	  this.data[13] = temp;
	  temp = this.data[11];
	  this.data[11] = this.data[14];
	  this.data[14] = temp;
	}

	//Function creates font texture data:
	function createFontTextureData()
	{
	  let result = { width: 256, height: 256, data: null };
	  let i = new Uint8Array(262144);
	  //NOTE: The generator code is smaller then a Base64-coded png image.
	  for (let n = 0; n < i.length; ++n)
		i[n] = 0;
	  let f = function(n){ i[n] = i[n+1] = i[n+2] = i[n+3] = 250; };
	  f(133140);f(133220);f(133720);f(133856);f(133916);f(133980);f(134164);f(134244);f(134748);f(134876);f(134940);f(135008);f(135188);f(135196);f(135200);f(135256);f(135260);f(135268);f(135320);f(135384);
	  f(135388);f(135392);f(135448);f(135452);f(135512);f(135516);f(135524);f(135580);f(135636);f(135652);f(135700);f(135716);f(135772);f(135828);f(135832);f(135836);f(135840);f(135844);f(135900);f(135964);
	  f(136032);f(136148);f(136152);f(136156);f(136160);f(136164);f(136168);f(136212);f(136216);f(136228);f(136276);f(136288);f(136292);f(136344);f(136404);f(136420);f(136472);f(136532);f(136544);f(136548);
	  f(136604);f(136660);f(136676);f(136728);f(136736);f(136796);f(136856);f(136924);f(136988);f(137056);f(137172);f(137192);f(137236);f(137252);f(137300);f(137316);f(137368);f(137440);f(137496);f(137556);
	  f(137572);f(137624);f(137632);f(137680);f(137688);f(137696);f(137704);f(137756);f(137816);f(137824);f(137884);f(137948);f(138012);f(138080);f(138196);f(138216);f(138260);f(138276);f(138324);f(138340);
	  f(138392);f(138456);f(138460);f(138520);f(138580);f(138596);f(138648);f(138656);f(138704);f(138712);f(138720);f(138728);f(138780);f(138840);f(138848);f(138908);f(138968);f(139036);f(139108);f(139156);
	  f(139164);f(139168);f(139220);f(139240);f(139284);f(139288);f(139300);f(139348);f(139360);f(139364);f(139416);f(139420);f(139476);f(139492);f(139544);f(139604);f(139620);f(139668);f(139684);f(139724);
	  f(139736);f(139744);f(139756);f(139800);f(139808);f(139860);f(139876);f(139936);f(139996);f(140060);f(140128);f(140184);f(140188);f(140196);f(140244);f(140264);f(140308);f(140316);f(140320);f(140376);
	  f(140380);f(140388);f(140440);f(140448);f(140504);f(140508);f(140512);f(140564);f(140568);f(140572);f(140628);f(140644);f(140692);f(140708);f(140748);f(140764);f(140780);f(140820);f(140836);f(140884);
	  f(140900);f(140948);f(140952);f(140956);f(140960);f(140964);f(141020);f(141084);f(141152);f(141268);f(141288);f(141592);f(142044);f(142108);f(142176);f(142292);f(142296);f(142300);f(142304);f(142308);
	  f(142312);f(142616);f(143072);f(143132);f(143196);f(149972);f(149976);f(149980);f(149984);f(150168);f(151012);f(151196);f(151640);f(151644);f(151652);f(151700);f(151708);f(151712);f(151768);f(151772);
	  f(151776);f(151832);f(151836);f(151844);f(151896);f(151900);f(151904);f(151964);f(152024);f(152028);f(152036);f(152084);f(152100);f(152156);f(152220);f(152276);f(152288);f(152348);f(152400);f(152412);
	  f(152424);f(152468);f(152484);f(152536);f(152540);f(152544);f(152660);f(152672);f(152676);f(152724);f(152728);f(152740);f(152788);f(152804);f(152852);f(152864);f(152868);f(152916);f(152932);f(152988);
	  f(153044);f(153056);f(153060);f(153108);f(153124);f(153180);f(153244);f(153300);f(153308);f(153372);f(153424);f(153436);f(153448);f(153492);f(153508);f(153556);f(153572);f(153684);f(153700);f(153748);
	  f(153764);f(153812);f(153876);f(153892);f(153940);f(154012);f(154068);f(154084);f(154132);f(154148);f(154204);f(154268);f(154324);f(154332);f(154396);f(154448);f(154460);f(154472);f(154516);f(154532);
	  f(154580);f(154596);f(154712);f(154716);f(154720);f(154724);f(154772);f(154788);f(154836);f(154900);f(154916);f(154964);f(154968);f(154972);f(154976);f(154980);f(155036);f(155092);f(155108);f(155156);
	  f(155172);f(155228);f(155292);f(155348);f(155352);f(155420);f(155472);f(155484);f(155496);f(155540);f(155556);f(155604);f(155620);f(155732);f(155748);f(155796);f(155800);f(155812);f(155860);f(155876);
	  f(155924);f(155936);f(155940);f(155988);f(156004);f(156060);f(156116);f(156128);f(156132);f(156180);f(156184);f(156196);f(156252);f(156316);f(156372);f(156380);f(156444);f(156496);f(156500);f(156508);
	  f(156512);f(156520);f(156564);f(156568);f(156580);f(156628);f(156644);f(156760);f(156764);f(156768);f(156820);f(156828);f(156832);f(156888);f(156892);f(156896);f(156952);f(156956);f(156964);f(157016);
	  f(157020);f(157024);f(157080);f(157084);f(157088);f(157144);f(157148);f(157156);f(157204);f(157212);f(157216);f(157276);f(157340);f(157396);f(157408);f(157468);f(157520);f(157528);f(157540);f(157588);
	  f(157596);f(157600);f(157656);f(157660);f(157664);f(157724);f(157844);f(157988);f(158108);f(158228);f(158420);f(158492);f(158744);f(158868);f(159012);f(159136);f(159252);f(159324);f(159388);f(159444);
	  f(159516);f(166616);f(166620);f(166744);f(166748);f(166868);f(166872);f(166876);f(166880);f(166884);f(166888);f(167640);f(167772);f(167956);f(168024);f(168028);f(168032);f(168040);f(168080);f(168100);
	  f(168148);f(168152);f(168156);f(168160);f(168220);f(168276);f(168280);f(168284);f(168288);f(168348);f(168400);f(168424);f(168464);f(168484);f(168540);f(168592);f(168596);f(168600);f(168604);f(168608);
	  f(168612);f(168664);f(168736);f(168796);f(168980);f(169044);f(169060);f(169104);f(169120);f(169168);f(169188);f(169244);f(169296);f(169316);f(169372);f(169424);f(169448);f(169492);f(169504);f(169564);
	  f(169620);f(169688);f(169760);f(169820);f(170004);f(170064);f(170076);f(170080);f(170088);f(170128);f(170144);f(170212);f(170268);f(170320);f(170340);f(170392);f(170400);f(170444);f(170452);f(170468);
	  f(170476);f(170516);f(170524);f(170588);f(170648);f(170712);f(170780);f(170844);f(171028);f(171032);f(171036);f(171040);f(171088);f(171112);f(171152);f(171164);f(171228);f(171232);f(171292);f(171344);
	  f(171364);f(171416);f(171424);f(171468);f(171476);f(171492);f(171500);f(171544);f(171548);f(171612);f(171672);f(171736);f(171804);f(171868);f(172052);f(172068);f(172112);f(172136);f(172176);f(172180);
	  f(172184);f(172188);f(172192);f(172244);f(172248);f(172316);f(172368);f(172388);f(172436);f(172452);f(172492);f(172504);f(172512);f(172524);f(172568);f(172572);f(172632);f(172640);f(172700);f(172760);
	  f(172828);f(172892);f(172948);f(172964);f(173076);f(173092);f(173136);f(173160);f(173200);f(173220);f(173264);f(173340);f(173392);f(173412);f(173460);f(173476);f(173516);f(173528);f(173536);f(173548);
	  f(173588);f(173596);f(173652);f(173668);f(173724);f(173784);f(173852);f(173916);f(173976);f(173984);f(174100);f(174116);f(174164);f(174180);f(174224);f(174244);f(174288);f(174308);f(174364);f(174416);
	  f(174436);f(174480);f(174504);f(174536);f(174552);f(174560);f(174576);f(174612);f(174624);f(174676);f(174692);f(174752);f(174808);f(174872);f(174940);f(175000);f(175008);f(175124);f(175128);f(175132);
	  f(175136);f(175192);f(175196);f(175200);f(175248);f(175252);f(175256);f(175260);f(175264);f(175316);f(175320);f(175324);f(175328);f(175380);f(175384);f(175388);f(175392);f(175396);f(175440);f(175460);
	  f(175504);f(175528);f(175560);f(175580);f(175600);f(175632);f(175652);f(175696);f(175720);f(175764);f(175768);f(175772);f(175776);f(175780);f(175832);f(175836);f(175896);f(175960);f(175964);f(176028);
	  f(182288);f(182292);f(182296);f(182300);f(182304);f(182308);f(183308);f(183336);f(183340);f(184328);f(184340);f(184344);f(184352);f(184356);f(184400);f(184424);f(184464);f(184468);f(184472);f(184476);
	  f(184480);f(184536);f(184540);f(184544);f(184592);f(184596);f(184600);f(184604);f(184660);f(184664);f(184668);f(184672);f(184676);f(184724);f(184792);f(184796);f(184800);f(184848);f(184868);f(184924);
	  f(184984);f(184988);f(185040);f(185060);f(185108);f(185112);f(185116);f(185120);f(185124);f(185168);f(185180);f(185192);f(185232);f(185252);f(185304);f(185308);f(185312);f(185352);f(185360);f(185372);
	  f(185376);f(185384);f(185424);f(185448);f(185488);f(185508);f(185556);f(185572);f(185616);f(185632);f(185684);f(185748);f(185812);f(185828);f(185872);f(185892);f(185948);f(186004);f(186016);f(186064);
	  f(186080);f(186132);f(186192);f(186204);f(186216);f(186256);f(186272);f(186276);f(186324);f(186340);f(186376);f(186384);f(186400);f(186412);f(186452);f(186456);f(186460);f(186464);f(186468);f(186512);
	  f(186532);f(186576);f(186640);f(186660);f(186708);f(186772);f(186832);f(186856);f(186896);f(186916);f(186972);f(187028);f(187040);f(187088);f(187104);f(187156);f(187216);f(187224);f(187232);f(187240);
	  f(187280);f(187292);f(187300);f(187344);f(187368);f(187400);f(187408);f(187424);f(187436);f(187476);f(187492);f(187536);f(187556);f(187600);f(187664);f(187684);f(187732);f(187796);f(187856);f(187872);
	  f(187876);f(187880);f(187920);f(187940);f(187996);f(188064);f(188112);f(188116);f(188124);f(188180);f(188240);f(188248);f(188256);f(188264);f(188304);f(188316);f(188324);f(188368);f(188392);f(188424);
	  f(188436);f(188448);f(188452);f(188460);f(188504);f(188512);f(188560);f(188564);f(188568);f(188572);f(188576);f(188624);f(188688);f(188708);f(188756);f(188760);f(188764);f(188768);f(188772);f(188820);
	  f(188824);f(188828);f(188832);f(188880);f(188944);f(188948);f(188952);f(188956);f(188960);f(188964);f(189020);f(189088);f(189136);f(189144);f(189148);f(189204);f(189264);f(189272);f(189280);f(189288);
	  f(189328);f(189336);f(189348);f(189392);f(189416);f(189452);f(189464);f(189468);f(189476);f(189484);f(189528);f(189536);f(189584);f(189604);f(189648);f(189712);f(189732);f(189780);f(189844);f(189904);
	  f(189968);f(189988);f(190044);f(190112);f(190160);f(190172);f(190228);f(190288);f(190292);f(190308);f(190312);f(190352);f(190360);f(190372);f(190416);f(190440);f(190480);f(190504);f(190552);f(190560);
	  f(190608);f(190628);f(190676);f(190692);f(190736);f(190752);f(190804);f(190868);f(190932);f(190948);f(190992);f(191012);f(191068);f(191136);f(191184);f(191200);f(191252);f(191312);f(191316);f(191332);
	  f(191336);f(191376);f(191380);f(191396);f(191444);f(191460);f(191508);f(191512);f(191516);f(191520);f(191524);f(191580);f(191632);f(191636);f(191640);f(191644);f(191648);f(191704);f(191708);f(191712);
	  f(191760);f(191764);f(191768);f(191772);f(191828);f(191832);f(191836);f(191840);f(191844);f(191892);f(191896);f(191900);f(191904);f(191908);f(191960);f(191964);f(191968);f(192016);f(192036);f(192092);
	  f(192160);f(192208);f(192228);f(192276);f(192336);f(192360);f(192400);f(192420);f(192472);f(192476);f(192480);f(199384);f(200408);f(200728);f(200732);f(200736);f(200796);f(200852);f(200856);f(200860);
	  f(200864);f(200868);f(200920);f(200924);f(200928);f(200992);f(201048);f(201052);f(201056);f(201112);f(201116);f(201120);f(201176);f(201240);f(201244);f(201248);f(201304);f(201308);f(201312);f(201368);
	  f(201432);f(201692);f(201748);f(201764);f(201820);f(201880);f(201940);f(201956);f(202016);f(202068);f(202084);f(202132);f(202148);f(202200);f(202260);f(202276);f(202324);f(202340);f(202532);f(202644);
	  f(202772);f(202788);f(202844);f(202908);f(202980);f(203028);f(203032);f(203036);f(203040);f(203044);f(203108);f(203156);f(203172);f(203224);f(203284);f(203300);f(203364);f(203544);f(203548);f(203552);
	  f(203604);f(203608);f(203612);f(203616);f(203620);f(203672);f(203676);f(203680);f(203740);f(203796);f(203812);f(203868);f(203936);f(204004);f(204052);f(204064);f(204132);f(204180);f(204196);f(204252);
	  f(204308);f(204324);f(204376);f(204380);f(204384);f(204388);f(204564);f(204708);f(204764);f(204820);f(204836);f(204892);f(204964);f(205020);f(205024);f(205080);f(205088);f(205140);f(205144);f(205148);
	  f(205152);f(205204);f(205208);f(205212);f(205216);f(205276);f(205336);f(205340);f(205344);f(205396);f(205412);f(205592);f(205596);f(205600);f(205652);f(205656);f(205660);f(205664);f(205668);f(205720);
	  f(205724);f(205728);f(205792);f(205844);f(205860);f(205908);f(205916);f(205988);f(206052);f(206104);f(206112);f(206164);f(206228);f(206304);f(206356);f(206372);f(206420);f(206436);f(206488);f(206552);
	  f(206628);f(206740);f(206820);f(206868);f(206884);f(206936);f(206940);f(206996);f(207012);f(207060);f(207076);f(207132);f(207136);f(207192);f(207252);f(207268);f(207328);f(207380);f(207396);f(207444);
	  f(207460);f(207828);f(207844);f(207896);f(207900);f(207904);f(207964);f(208024);f(208028);f(208032);f(208088);f(208092);f(208096);f(208160);f(208216);f(208220);f(208224);f(208228);f(208280);f(208284);
	  f(208288);f(208340);f(208344);f(208348);f(208352);f(208356);f(208408);f(208412);f(208416);f(208472);f(208476);f(208480);f(208856);f(208860);f(208864);f(215584);f(215640);f(215836);f(216348);f(216604);
	  f(216668);f(216860);f(217180);f(217300);f(217308);f(217368);f(217372);f(217376);f(217428);f(217444);f(217448);f(217492);f(217496);f(217500);f(217508);f(217624);f(217696);f(217884);f(218012);f(218072);
	  f(218324);f(218332);f(218388);f(218396);f(218404);f(218456);f(218464);f(218476);f(218512);f(218528);f(218648);f(218720);f(218844);f(219096);f(219228);f(219348);f(219352);f(219356);f(219360);f(219364);
	  f(219420);f(219428);f(219480);f(219488);f(219500);f(219536);f(219552);f(219556);f(219672);f(219744);f(219868);f(219992);f(219996);f(220000);f(220124);f(220252);f(220376);f(220384);f(220444);f(220452);
	  f(220508);f(220516);f(220520);f(220564);f(220572);f(220696);f(220768);f(220884);f(220888);f(220892);f(220896);f(220900);f(221148);f(221276);f(221400);f(221408);f(221464);f(221468);f(221472);f(221520);
	  f(221524);f(221532);f(221592);f(221596);f(221720);f(221792);f(221848);f(221856);f(221916);f(222172);f(222300);f(222360);f(222368);f(222420);f(222424);f(222428);f(222432);f(222436);f(222484);f(222492);
	  f(222540);f(222552);f(222560);f(222612);f(222624);f(222684);f(222744);f(222816);f(222876);f(222940);f(223196);f(223324);f(223384);f(223392);f(223452);f(223460);f(223508);f(223516);f(223524);f(223564);
	  f(223576);f(223584);f(223636);f(223648);f(223708);f(223772);f(223836);f(223896);f(223900);f(223904);f(224224);f(224348);f(224408);f(224416);f(224476);f(224484);f(224536);f(224540);f(224544);f(224592);
	  f(224596);f(224612);f(224664);f(224668);f(224732);f(224800);f(224856);f(224924);f(225248);
	  result.data = i;
	  return result;
	}

	//Constructor:
	function TextRenderer(glContext)
	{
	  //No valid context avail:
	  if(!glContext)
		throw 'TextRenderer::TextRenderer(..): Initialization of WebGL failed!\nPlease use a web browser with WebGL-Support!';
	  //Store GL-Context:
	  this.glContext = glContext;
	  let gl = this.glContext;
	  //Define shaders:
	  const vertexShader = `
	  attribute vec2 inVertexPos;
	  attribute vec2 inTexCoord;
	  attribute vec4 inColor;
	  uniform mat4 matMVP;
	  varying vec2 texCoord0;
	  varying vec4 color0;
	  void main()
	  {
		gl_Position = matMVP * vec4(inVertexPos, 0.0, 1.0);
		texCoord0 = inTexCoord;
		color0 = inColor;
	  }`;
	  const fragmentShader = `
	  precision mediump float;
	  varying vec4 color0;
	  varying vec2 texCoord0;
	  uniform sampler2D fontTex;
	  void main()
	  {
		gl_FragColor = color0 * texture2D(fontTex, texCoord0);
	  }`;
	  //Load shader program:
	  this.program = new GLProgram(gl, vertexShader, fragmentShader);
	  //Bind shader variables:
	  this.shaderLocInVertexPos = gl.getAttribLocation(this.program.glID, "inVertexPos");
	  this.shaderLocInTexCoord = gl.getAttribLocation(this.program.glID, "inTexCoord");
	  this.shaderLocInColor = gl.getAttribLocation(this.program.glID, "inColor");
	  this.shaderLocMatMVP = gl.getUniformLocation(this.program.glID, "matMVP");
	  this.shaderLocFontTex = gl.getUniformLocation(this.program.glID, "fontTex");
	  //Create VBO for geometry and color data:
	  this.vbo = new GLVBO(gl);
	  //Create texture for font:
	  let fontTexData = createFontTextureData();
	  this.texture = new GLTexture(gl, fontTexData.width, fontTexData.height, fontTexData.data, gl.TEXTURE_2D, gl.RGBA, gl.RGBA, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
	}

	//Function generates all geometry data for rendering the text:
	TextRenderer.prototype.generateVBOData = function(text, textPosition, textColor)
	{
	  let fontW = 16, fontH = 16, fontD = 8;
	  let fontRecW = 1.0 / fontW, fontRecH = 1.0 / fontH;
	  let data = [];
	  for (let n = 0; n < text.length; ++n)
	  {
		let c = text.charCodeAt(n);
		let x = [textPosition[0] + n * fontD, textPosition[0] + n * fontD + fontW];
		let y = [textPosition[1], textPosition[1] + fontH];
		let u = [fontRecW * (c % 16), fontRecW * (c % 16) + fontRecW];
		let v = [1.0 - (1 + Math.floor(c / 16)) * fontRecH, 1.0 - (1 + Math.floor(c / 16)) * fontRecH + fontRecH];
		let cData = [ x[0], y[0], u[0], v[0], textColor[0], textColor[1], textColor[2], textColor[3],
					  x[0], y[1], u[0], v[1], textColor[0], textColor[1], textColor[2], textColor[3],
					  x[1], y[0], u[1], v[0], textColor[0], textColor[1], textColor[2], textColor[3],
					  x[1], y[0], u[1], v[0], textColor[0], textColor[1], textColor[2], textColor[3],
					  x[0], y[1], u[0], v[1], textColor[0], textColor[1], textColor[2], textColor[3],
					  x[1], y[1], u[1], v[1], textColor[0], textColor[1], textColor[2], textColor[3] ];
		data = data.concat(cData);
	  }
	  return data;
	}

	//Function processes rendering of text:
	TextRenderer.prototype.process = function(text, textPosition, textColor, texRotation, canvasWidth, canvasHeight)
	{
	  let gl = this.glContext;
	  //Generate VBO data:
	  let data = this.generateVBOData(text, textPosition, textColor);
	  //Update data in VBO:
	  this.vbo.update(new Float32Array(data));
	  this.nTrianglesToRender = data.length / 8;
	  if(this.nTrianglesToRender < 1)
		return;
	  //Render VBO:
	  this.program.bind();
	  gl.disable(gl.DEPTH_TEST);
	  gl.enable(gl.BLEND);
	  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	  gl.uniform1i(this.shaderLocfontTex, 0);
	  gl.activeTexture(gl.TEXTURE0);
	  this.texture.bind();
	  //Set geometry data:
	  let size = 2;          //2 components per vertex
	  let type = gl.FLOAT;   //32-Bit floats
	  let normalize = false; //no data normalization
	  let stride = 8 * 4;    //stride to next element (number of bytes)
	  let offset = 0;        //start of buffer data
	  this.vbo.bind();
	  gl.vertexAttribPointer(this.shaderLocInVertexPos, size, type, normalize, stride, offset);
	  offset = 8;
	  gl.vertexAttribPointer(this.shaderLocInTexCoord, size, type, normalize, stride, offset);
	  size = 4;
	  offset = 16;
	  gl.vertexAttribPointer(this.shaderLocInColor, size, type, normalize, stride, offset);
	  gl.enableVertexAttribArray(this.shaderLocInVertexPos);
	  gl.enableVertexAttribArray(this.shaderLocInTexCoord);
	  gl.enableVertexAttribArray(this.shaderLocInColor);
	  let matMV = new Matrix4f();
	  matMV.setIdentity();
	  let cosa = Math.cos((texRotation / 180.0) * Math.PI);
	  let sina = Math.sin((texRotation / 180.0) * Math.PI);
	  matMV.data[0] = cosa;
	  matMV.data[1] = -sina;
	  matMV.data[4] = sina;
	  matMV.data[5] = cosa;
	  let matMVP = new Matrix4f();
	  let left = 0.0, right = canvasWidth, bottom = 0.0, top = canvasHeight, near = -1.0, far = 1.0;
	  matMVP.setOrtho(left, right, bottom, top, near, far);
	  matMVP.multiply(matMV);
	  gl.uniformMatrix4fv(this.shaderLocMatMVP, false, matMVP.data);
	  //Draw the geometry:
	  let primitiveType = gl.TRIANGLES;
	  let dataOffset = 0;
	  gl.drawArrays(primitiveType, dataOffset, this.nTrianglesToRender);
	  //Restore settings:
	  gl.disable(gl.BLEND);
	  gl.enable(gl.DEPTH_TEST);
	}

	//Constructor:
	function GridRenderer(glContext)
	{
	  //No valid context avail:
	  if(!glContext)
		throw 'GridRenderer(..): Initialization of WebGL failed!\nPlease use a web browser with WebGL-Support!';
	  //Store GL-Context:
	  this.glContext = glContext;
	  let gl = this.glContext;
	  //Define shaders:
	  const vertexShader = `
	  attribute vec2 inVertexPos;
	  uniform mat4 matMVP;
	  void main()
	  {
		gl_Position = matMVP * vec4(inVertexPos, 0.0, 1.0);
	  }`;
	  const fragmentShader = `
	  precision mediump float;
	  uniform vec4 color0;
	  void main()
	  {
		gl_FragColor = color0;
	  }`;
	  //Load shader program:
	  this.program = new GLProgram(gl, vertexShader, fragmentShader);
	  //Bind shader variables:
	  this.shaderLocInVertexPos = gl.getAttribLocation(this.program.glID, "inVertexPos");
	  this.shaderLocMatMVP = gl.getUniformLocation(this.program.glID, "matMVP");
	  this.scaleGridColor = [0.0, 0.29, 0.58];
	  this.blendingFactor = 0.0;
	  this.shaderLocColor0 = gl.getUniformLocation(this.program.glID, "color0");
	  //Create VBO for geometry and color data:
	  this.vbo = new GLVBO(gl);
	  this.nIndicesToRender = 0;
	  this.renderSize = [0, 0];
	  this.minSeparationLines = 5;
	  //Create text renderer:
	  this.textRenderer = new TextRenderer(glContext);
	}

	//Function generates all geometry data for rendering the grid:
	GridRenderer.prototype.generateVBOData = function(canvasWidth, canvasHeight)
	{
	  let gridCellSize = Math.min(canvasWidth / (this.minSeparationLines + 1), canvasHeight / (this.minSeparationLines + 1));
	  let data = [];
	  let lineWidth = 3.0;
	  let generateLineDataFunction = function(x, y)  //Function generates triangle data for a line
	  {
		let data = [];
		data.push(x[0], y[0]);
		data.push(x[0], y[1]);
		data.push(x[1], y[0]);
		data.push(x[0], y[1]);
		data.push(x[1], y[1]);
		data.push(x[1], y[0]);
		return data;
	  }
	  //Horizontal lines:
	  for (let lineY = 0; lineY < canvasHeight / 2 + lineWidth; lineY += gridCellSize)
	  {
		//Line in upper half:
		let x = [0, canvasWidth], y = [canvasHeight / 2 + lineY - lineWidth / 2.0, canvasHeight / 2 + lineY + lineWidth / 2.0]; //x = {MinX, MaxX}, y = {MinY, MaxY}
		data = data.concat(generateLineDataFunction(x, y));
		//Line in lower half:
		if(lineY > 0)
		{
		  y = [canvasHeight / 2 - lineY - lineWidth / 2.0, canvasHeight / 2 - lineY + lineWidth / 2.0];
		  data = data.concat(generateLineDataFunction(x, y));
		}
	  }
	  //Vertical lines:
	  for (let lineX = 0; lineX < canvasWidth / 2 + lineWidth; lineX += gridCellSize)
	  {
		//Line in right half:
		let x = [canvasWidth / 2 + lineX - lineWidth / 2.0, canvasWidth / 2 + lineX + lineWidth / 2.0], y = [0, canvasHeight]; //x = {MinX, MaxX}, y = {MinY, MaxY}
		data = data.concat(generateLineDataFunction(x, y));
		//Line in left half:
		if(lineX > 0)
		{
		  x = [canvasWidth / 2 - lineX - lineWidth / 2.0, canvasWidth / 2 - lineX + lineWidth / 2.0];
		  data = data.concat(generateLineDataFunction(x, y));
		}
	  }  
	  //Cross:
	  let crossMinX = (canvasWidth / 2) - 0.25 * gridCellSize, crossMaxX = (canvasWidth / 2) + 0.25 * gridCellSize,
		  crossMinY = (canvasHeight / 2) - 0.25 * gridCellSize, crossMaxY = (canvasHeight / 2) + 0.25 * gridCellSize;
	  data.push(crossMinX - lineWidth / 2, crossMaxY - lineWidth / 2);
	  data.push(crossMinX + lineWidth / 2, crossMaxY + lineWidth / 2);
	  data.push(crossMaxX + lineWidth / 2, crossMinY + lineWidth / 2);
	  data.push(crossMinX - lineWidth / 2, crossMaxY - lineWidth / 2);
	  data.push(crossMaxX + lineWidth / 2, crossMinY + lineWidth / 2);
	  data.push(crossMaxX - lineWidth / 2, crossMinY - lineWidth / 2);
	  data.push(crossMinX + lineWidth / 2, crossMinY - lineWidth / 2);
	  data.push(crossMinX - lineWidth / 2, crossMinY + lineWidth / 2);
	  data.push(crossMaxX - lineWidth / 2, crossMaxY + lineWidth / 2);
	  data.push(crossMinX + lineWidth / 2, crossMinY - lineWidth / 2);
	  data.push(crossMaxX - lineWidth / 2, crossMaxY + lineWidth / 2);
	  data.push(crossMaxX + lineWidth / 2, crossMaxY - lineWidth / 2);
	  return data;
	}

	//Function returns true, if mouse cursor is inside translation circle:
	GridRenderer.prototype.isInsideTranslationCircle = function(mousePosX, mousePosY)
	{
	  let gridCellSize = Math.min(this.renderSize[0] / (this.minSeparationLines + 1), this.renderSize[1] / (this.minSeparationLines + 1));
	  let dx = mousePosX - (this.renderSize[0] / 2), dy = mousePosY - (this.renderSize[1] / 2);
	  return Math.sqrt(dx * dx + dy * dy) < gridCellSize * 2;
	}

	//Function processes rendering of the grid:
	GridRenderer.prototype.process = function(canvasWidth, canvasHeight, pixelToMillimeter, scale)
	{
	  let gl = this.glContext;
	  //Update VBO:
	  if(this.nLinesToRender < 1 || this.renderSize[0] != canvasWidth || this.renderSize[1] != canvasHeight)
	  {
		//Generate geometry data:
		let data = this.generateVBOData(canvasWidth, canvasHeight);
		//Update data in VBO:
		this.vbo.update(new Float32Array(data));
		this.nIndicesToRender = data.length / 2;
		this.renderSize = [canvasWidth, canvasHeight];
	  }
	  //Render VBO:
	  this.program.bind();
	  gl.disable(gl.DEPTH_TEST);
	  gl.enable(gl.BLEND);
	  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	  //Set geometry data:
	  let size = 2;          //2 components per vertex
	  let type = gl.FLOAT;   //32-Bit floats
	  let normalize = false; //no data normalization
	  let stride = 2 * 4;    //stride to next element (number of bytes)
	  let offset = 0;        //start of buffer data
	  this.vbo.bind();
	  gl.vertexAttribPointer(this.shaderLocInVertexPos, size, type, normalize, stride, offset);
	  gl.enableVertexAttribArray(this.shaderLocInVertexPos);
	  let left = 0.0, right = canvasWidth, bottom = 0.0, top = canvasHeight, near = -1.0, far = 1.0;
	  let matMVP = new Matrix4f();
	  matMVP.setOrtho(left, right, bottom, top, near, far);
	  gl.uniformMatrix4fv(this.shaderLocMatMVP, false, matMVP.data);
	  gl.uniform4f(this.shaderLocColor0, this.scaleGridColor[0], this.scaleGridColor[1], this.scaleGridColor[2], 0.9 * this.blendingFactor);
	  //Draw the geometry:
	  let primitiveType = gl.TRIANGLES;
	  let dataOffset = 0;
	  gl.drawArrays(primitiveType, dataOffset, this.nIndicesToRender);
	  //Restore settings:
	  gl.disable(gl.BLEND);
	  gl.enable(gl.DEPTH_TEST);
	  //Print cell size:
	  if(pixelToMillimeter > 0)
	  {
		let gridCellSize = Math.min(canvasWidth / (this.minSeparationLines + 1), canvasHeight / (this.minSeparationLines + 1));
		let value = pixelToMillimeter * gridCellSize / scale;
		let text = '' + value.toFixed(2) + ' mm';
		if(text.length * 8 < gridCellSize - 10)
		{
		  //Horizontal text:
		  let textPosX = canvasWidth / 2 - Math.floor((canvasWidth / 2) / gridCellSize) * gridCellSize;
		  let textPosY = Math.floor((canvasHeight / 2) / gridCellSize) * gridCellSize + canvasHeight / 2 - 16;
		  let centerOffset = (gridCellSize - 8 * text.length) / 2;
		  let textPosition = [Math.floor(textPosX + centerOffset), Math.floor(textPosY)];
		  let textColor = [this.scaleGridColor[0], this.scaleGridColor[1], this.scaleGridColor[2], 0.9 * this.blendingFactor];
		  let texRotation = 0.0;
		  this.textRenderer.process(text, textPosition, textColor, texRotation, canvasWidth, canvasHeight);
		  //Vertical text:
		  texRotation = 90.0;
		  textPosition = [Math.floor(-canvasHeight / 2 - Math.floor((canvasHeight / 2) / gridCellSize) * gridCellSize + centerOffset),  //Height due to rotation
						  Math.floor(canvasWidth / 2 - Math.floor((canvasWidth / 2) / gridCellSize) * gridCellSize)];
		  this.textRenderer.process(text, textPosition, textColor, texRotation, canvasWidth, canvasHeight);
		}
	  }
	}

	let VECTOR3F_ARRAY_T = typeof Float32Array !== "undefined"? Float32Array: Array;     //Data type of the array
	let VECTOR3F_DIMS = 3;                                                               //Number of dimensions

	//Standard constructor:
	function Vector3f()
	{
	  this.data = new VECTOR3F_ARRAY_T(VECTOR3F_DIMS);
	  for (let n = 0; n < VECTOR3F_DIMS; ++n)
		this.data[n] = 0.0;
	}

	//Constructor with parameter:
	function Vector3f(x, y, z)
	{
	  this.data = new VECTOR3F_ARRAY_T(VECTOR3F_DIMS);
	  this.data[0] = x;
	  this.data[1] = y;
	  this.data[2] = z;
	}

	//Function returns normalized vector:
	Vector3f.prototype.normalized = function()
	{
	  let len = this.data[0] * this.data[0] + this.data[1] * this.data[1] + this.data[2] * this.data[2];
	  let result = new Vector3f(this.data[0], this.data[1], this.data[2]);
	  if (len > 0)
	  {
		len = 1.0 / Math.sqrt(len);
		for (let n = 0; n < VECTOR3F_DIMS; ++n)
		  result[n] *= len
	  }
	  return result;
	}

	//Define constants:
	var VisualizationWidgetConst =
	{
	  DefaultAmbient: [0.1, 0.1, 0.1, 1.0],
	  DefaultBackgroundColor: [1.0, 1.0, 1.0, 1.0],
	  DefaultDiffusePortion: 0.8,
	  DefaultFixedMaterialColor: [0.0, 0.0, 0.0, 0.0],
	  DefaultIndexOfRefraction: 0.470,
	  DefaultDirectionalLightColor: [1.5, 1.5, 1.5],
	  DefaultDirectionalLightDirection: [0.57, -0.57, -0.57],
	  DefaultMetallic: 0.470,
	  DefaultRoughness: 0.451,
	  DefaultEnvironmentReflectance: 0.1
	};
	Object.defineProperty(VisualizationWidgetConst, 'DefaultAmbient', { writable: false });
	Object.defineProperty(VisualizationWidgetConst, 'DefaultBackgroundColor', { writable: false });
	Object.defineProperty(VisualizationWidgetConst, 'DefaultDiffusePortion', { writable: false });
	Object.defineProperty(VisualizationWidgetConst, 'DefaultFixedMaterialColor', { writable: false });
	Object.defineProperty(VisualizationWidgetConst, 'DefaultIndexOfRefraction', { writable: false });
	Object.defineProperty(VisualizationWidgetConst, 'DefaultDirectionalLightColor', { writable: false });
	Object.defineProperty(VisualizationWidgetConst, 'DefaultDirectionalLightDirection', { writable: false });
	Object.defineProperty(VisualizationWidgetConst, 'DefaultMetallic', { writable: false });
	Object.defineProperty(VisualizationWidgetConst, 'DefaultRoughness', { writable: false });
	Object.defineProperty(VisualizationWidgetConst, 'DefaultEnvironmentReflectance', { writable: false });

	//Constructor:
	function VisualizationWidget(canvas)
	{
	  //Store GL-Context:
	  this.glContext = canvas.getContext("webgl", {premultipliedAlpha: false});
	  let gl = this.glContext;
	  //No valid context avail:
	  if(!gl)
		throw 'VisualizationWidget(..): Initialization of WebGL failed!\nPlease use a web browser with WebGL-Support!';
	  //Init var(s):
	  this.colorImageSize = [1, 1];                                                                           //Width and height of color image
	  this.normalImageSize = [1, 1];                                                                          //Width and height of normal image
	  this.transformation = [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0]; //4x4 Transformation
	  this.ambient = Object.assign({}, VisualizationWidgetConst.DefaultAmbient);                //Copy array object (otherwise its referenced)
	  this.backgroundColor = Object.assign({}, VisualizationWidgetConst.DefaultBackgroundColor);
	  this.directionalLightDirection = [VisualizationWidgetConst.DefaultDirectionalLightDirection[0], VisualizationWidgetConst.DefaultDirectionalLightDirection[1], VisualizationWidgetConst.DefaultDirectionalLightDirection[2]];
	  this.directionalLightColor = [VisualizationWidgetConst.DefaultDirectionalLightColor[0], VisualizationWidgetConst.DefaultDirectionalLightColor[1], VisualizationWidgetConst.DefaultDirectionalLightColor[2]];
	  this.fixedMaterialColor = [VisualizationWidgetConst.DefaultFixedMaterialColor[0], VisualizationWidgetConst.DefaultFixedMaterialColor[1], VisualizationWidgetConst.DefaultFixedMaterialColor[2],
								 VisualizationWidgetConst.DefaultFixedMaterialColor[3]];
	  this.roughness = VisualizationWidgetConst.DefaultRoughness;                               //Atomic values can be assign directly
	  this.metallic = VisualizationWidgetConst.DefaultMetallic;
	  this.indexOfRefraction = VisualizationWidgetConst.DefaultIndexOfRefraction;
	  this.diffusePortion = VisualizationWidgetConst.DefaultDiffusePortion;
	  this.environmentReflectance = VisualizationWidgetConst.DefaultEnvironmentReflectance;
	  this.pixelToMillimeter = 0;
	  this.flipHorizontalPercent = 0.0;
	  this.flipVerticalPercent = 0.0;
	  this.gaussKernelHSize = 2;
	  //Load shader program:
	  let macroPos = FragmentShader.indexOf("#define GAUSS_HSIZE");
	  if(macroPos < 0)
		throw "Failed to find shader macro GAUSS_HSIZE!";
	  let fragmentShaderGauss3 = FragmentShader.slice(0, macroPos + 20) + "1" + FragmentShader.slice(macroPos + 21, FragmentShader.length);
	  let fragmentShaderGauss5 = FragmentShader.slice(0, macroPos + 20) + "2" + FragmentShader.slice(macroPos + 21, FragmentShader.length);
	  this.program = [new GLProgram(gl, VertexShader, fragmentShaderGauss3), new GLProgram(gl, VertexShader, fragmentShaderGauss5)];
	  //Bind shader variables:
	  this.shaderLocInVertexPos = [gl.getAttribLocation(this.program[0].glID, "inVertexPos"), gl.getAttribLocation(this.program[1].glID, "inVertexPos")];
	  this.shaderLocInTexCoord = [gl.getAttribLocation(this.program[0].glID, "inTexCoord"), gl.getAttribLocation(this.program[1].glID, "inTexCoord")];
	  this.shaderLocMatMVP = [gl.getUniformLocation(this.program[0].glID, "matMVP"), gl.getUniformLocation(this.program[1].glID, "matMVP")];
	  this.shaderLocColorTex = [gl.getUniformLocation(this.program[0].glID, "colorTex"), gl.getUniformLocation(this.program[1].glID, "colorTex")];
	  this.shaderLocNormalTex = [gl.getUniformLocation(this.program[0].glID, "normalTex"), gl.getUniformLocation(this.program[1].glID, "normalTex")];
	  this.shaderLocBackgroundMapTex = [gl.getUniformLocation(this.program[0].glID, "backgroundMapTex"), gl.getUniformLocation(this.program[1].glID, "backgroundMapTex")];
	  this.shaderLocCubemapTex = [gl.getUniformLocation(this.program[0].glID, "cubemapTex"), gl.getUniformLocation(this.program[1].glID, "cubemapTex")];
	  this.shaderLocInputImageSize = [gl.getUniformLocation(this.program[0].glID, "inputImageSize"), gl.getUniformLocation(this.program[1].glID, "inputImageSize")];
	  this.shaderLocAmbient = [gl.getUniformLocation(this.program[0].glID, "ambient"), gl.getUniformLocation(this.program[1].glID, "ambient")];
	  this.shaderLocBackgroundColor = [gl.getUniformLocation(this.program[0].glID, "backgroundColor"), gl.getUniformLocation(this.program[1].glID, "backgroundColor")];
	  this.shaderLocDirectionalLightDir = [gl.getUniformLocation(this.program[0].glID, "directionalLightDir"), gl.getUniformLocation(this.program[1].glID, "directionalLightDir")];
	  this.shaderLocDirectionalLightColor = [gl.getUniformLocation(this.program[0].glID, "directionalLightColor"), gl.getUniformLocation(this.program[1].glID, "directionalLightColor")];
	  this.shaderLocFixedMaterialColor = [gl.getUniformLocation(this.program[0].glID, "fixedMaterialColor"), gl.getUniformLocation(this.program[1].glID, "fixedMaterialColor")];
	  this.shaderLocRoughness = [gl.getUniformLocation(this.program[0].glID, "roughness"), gl.getUniformLocation(this.program[1].glID, "roughness")];
	  this.shaderLocMetallic = [gl.getUniformLocation(this.program[0].glID, "metallic"), gl.getUniformLocation(this.program[1].glID, "metallic")];
	  this.shaderLocIndexOfRefraction = [gl.getUniformLocation(this.program[0].glID, "indexOfRefraction"), gl.getUniformLocation(this.program[1].glID, "indexOfRefraction")];
	  this.shaderLocDiffusePortion = [gl.getUniformLocation(this.program[0].glID, "diffusePortion"), gl.getUniformLocation(this.program[1].glID, "diffusePortion")];
	  this.shaderLocEnvironmentReflectance = [gl.getUniformLocation(this.program[0].glID, "environmentReflectance"), gl.getUniformLocation(this.program[1].glID, "environmentReflectance")];
	  this.shaderLocMatObjSpaceToWorldSpaceRot = [gl.getUniformLocation(this.program[0].glID, "matObjSpaceToWorldSpaceRot"), gl.getUniformLocation(this.program[1].glID, "matObjSpaceToWorldSpaceRot")];
	  //Define enumeration of texture types:
	  this.TEXTURE_TYPES =
	  {
		TEXTURE_TYPE_COLOR: 'color_texture',
		TEXTURE_TYPE_NORMAL: 'normal_texture'
	  };
	  //Create textures:
	  this.colorTex = this.createTexture2D();
	  this.normalTex = this.createTexture2D();
	  this.cubemapTex = this.createTextureCUBE();
	  //Create VBO for geometry data:
	  this.vbo = new GLVBO(gl);
	  //Create default callback function for resize:
	  this.callbackResize = function(){ };  //can be overwritten from outside, defines e.g. new transformation when widget was resized
	  //Init renderer for icons:
	  this.iconRenderer = new IconRenderer(canvas);
	  //Create grid renderer:
	  this.gridRenderer = new GridRenderer(gl);
	}

	//Function adds translation:
	VisualizationWidget.prototype.addTranslation = function(dx, dy)
	{
	  this.transformation[12] += dx;
	  this.transformation[13] += dy;
	}

	//Function clears data:
	VisualizationWidget.prototype.clearData = function()
	{
	  this.colorImageSize[0] = this.colorImageSize[1] = 0;
	  this.normalImageSize[0] = this.normalImageSize[1] = 0;
	  this.pixelToMillimeter = 0;
	  //NOTE: No need for clearing textures here
	}

	//Function computes transformation with added rotation:
	VisualizationWidget.prototype.computeAddedRotation = function(objectCenterPos, angle)
	{
	  //Create rotation matrix for relative rotation:
	  let matRotation = new Matrix4f();
	  matRotation.setIdentity();
	  let cosa = Math.cos((angle / 180.0) * Math.PI);
	  let sina = Math.sin((angle / 180.0) * Math.PI);
	  matRotation.data[0] = matRotation.data[5] = cosa;
	  matRotation.data[1] = -sina;
	  matRotation.data[4] = sina;
	  //Set pivot point for rotation:
	  let matTrans = new Matrix4f(this.transformation[0], this.transformation[1], this.transformation[2], this.transformation[3],
								  this.transformation[4], this.transformation[5], this.transformation[6], this.transformation[7],
								  this.transformation[8], this.transformation[9], this.transformation[10], this.transformation[11],
								  this.transformation[12], this.transformation[13], this.transformation[14], this.transformation[15]);
	  let transformedPivotPoint = [objectCenterPos[0], objectCenterPos[1]];
	  //Compute transformation from projected middle window coordinate to the origin:
	  let matToOrigin = new Matrix4f();
	  matToOrigin.setIdentity();
	  matToOrigin.data[3] = -transformedPivotPoint[0];
	  matToOrigin.data[7] = -transformedPivotPoint[1];
	  //Compute transformation from origin back to middle window coordinate:
	  let matOriginToCenter = new Matrix4f();
	  matOriginToCenter.setIdentity();
	  matOriginToCenter.data[3] = -matToOrigin.data[3];
	  matOriginToCenter.data[7] = -matToOrigin.data[7];
	  //Add rotation:
	  let matRelTrans = matToOrigin.clone();
	  matRelTrans.multiply(matRotation);
	  matRelTrans.multiply(matOriginToCenter);
	  matRelTrans.transpose();
	  let matFinal = matTrans.clone();
	  matFinal.multiply(matRelTrans);
	  //Finished:
	  return matFinal.data;
	}

	//Function computes transformation with added scale:
	VisualizationWidget.prototype.computeAddedScale = function(pivotPointX, pivotPointY, sx, sy)
	{
	  //Create scale matrix for relative scale:
	  let matScale = new Matrix4f();
	  matScale.setIdentity();
	  matScale.data[0] = sx;
	  matScale.data[5] = sy;
	  //Compute position of the middle window coordinate on the image:
	  let matTrans = new Matrix4f(this.transformation[0], this.transformation[1], this.transformation[2], this.transformation[3],
								  this.transformation[4], this.transformation[5], this.transformation[6], this.transformation[7],
								  this.transformation[8], this.transformation[9], this.transformation[10], this.transformation[11],
								  this.transformation[12], this.transformation[13], this.transformation[14], this.transformation[15]);
	  let invTransformation = matTrans.clone();
	  invTransformation.invert();
	  let transformedPivotPoint = invTransformation.multipliedByVector4f(pivotPointX, pivotPointY, 0.0, 1.0);
	  //Compute transformation from projected middle window coordinate to the origin:
	  let matToOrigin = new Matrix4f();
	  matToOrigin.setIdentity();
	  matToOrigin.data[3] = -transformedPivotPoint[0];
	  matToOrigin.data[7] = -transformedPivotPoint[1];
	  //Compute transformation from origin back to middle window coordinate:
	  let matOriginToCenter = new Matrix4f();
	  matOriginToCenter.setIdentity();
	  matOriginToCenter.data[3] = -matToOrigin.data[3];
	  matOriginToCenter.data[7] = -matToOrigin.data[7];
	  //Add scale:
	  let matRelTrans = matToOrigin.clone();
	  matRelTrans.multiply(matScale);
	  matRelTrans.multiply(matOriginToCenter);
	  matRelTrans.transpose();
	  let matFinal = matTrans.clone();
	  matFinal.multiply(matRelTrans);
	  //Finished:
	  return matFinal.data;
	}

	//Function computes default transformation for viewing object on a canvas:
	VisualizationWidget.prototype.computeDefaultTransformation = function(objectCenterPos, objectRadius, objectRotation)
	{
	  let canvasWidth = this.glContext.canvas.width, canvasHeight =  this.glContext.canvas.height;
	  let matResult = new Matrix4f(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
	  //Compute scale dynamically from size:
	  let scale = 1.0;
	  if(objectRadius * 2 > canvasWidth)
		scale = Math.min(scale, canvasWidth / (objectRadius * 2));
	  if(objectRadius * 2 > canvasHeight)
		scale = Math.min(scale, canvasHeight / (objectRadius * 2));
	  //Set scale and rotation:
	  let cosa = Math.cos((-objectRotation / 180.0) * Math.PI);
	  let sina = Math.sin((-objectRotation / 180.0) * Math.PI);
	  matResult.data[0] = scale * cosa;
	  matResult.data[1] = scale * (-sina);
	  matResult.data[4] = scale * sina;
	  matResult.data[5] = scale * cosa;
	  //Set translation to middle of window:
	  let centerOffset = [-objectCenterPos[0], -objectCenterPos[1]];
	  matResult.data[3] = matResult.data[0] * centerOffset[0] + matResult.data[1] * centerOffset[1] + canvasWidth / 2.0;
	  matResult.data[7] = matResult.data[4] * centerOffset[0] + matResult.data[5] * centerOffset[1] + canvasHeight / 2.0;
	  matResult.transpose();
	  return matResult.data;
	}

	//Function create texture:
	VisualizationWidget.prototype.createTexture2D = function()
	{
	  let gl = this.glContext;
	  let texture = new GLTexture(gl, 1, 1, new Uint8Array([127, 127, 127, 255]), gl.TEXTURE_2D, gl.RGBA, gl.RGBA, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE); //fill it with one gray pixel
	  return texture;
	}

	//Function create texture:
	VisualizationWidget.prototype.createTextureCUBE = function()
	{
	  let cubemapGen = new CubemapGenerator();
	  let cubemapData = cubemapGen.computeOutdoorCubemap();
	  let gl = this.glContext;
	  let texture = new GLTexture(gl, null, null, cubemapData, gl.TEXTURE_CUBE_MAP, gl.RGB, gl.RGB, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
	  return texture;
	}

	//Function enables icons for interaction:
	VisualizationWidget.prototype.enableIcons = function(enableScale, enableFlip, enableObjectColorSelection, onFinished)
	{
	  this.iconRenderer.clearData();
	  //Icon images are not yet loaded, load images and add icons:
	  if(this.iconImages == null)
	  {
		this.iconImages = [ { id: "IconResetView", rawDataActive: iconDataResetView, rawDataInactive: iconDataResetView, imageAct: null, imageInact: null, animateClicked: true },
							{ id: "IconZoomOut", rawDataActive: iconDataZoomOut, rawDataInactive: iconDataZoomOut, imageAct: null, imageInact: null, animateClicked: true },
							{ id: "IconZoomIn", rawDataActive: iconDataZoomIn, rawDataInactive: iconDataZoomIn, imageAct: null, imageInact: null, animateClicked: true },
							{ id: "IconRotateLeft", rawDataActive: iconDataRotateLeft, rawDataInactive: iconDataRotateLeft, imageAct: null, imageInact: null, animateClicked: true },
							{ id: "IconRotateRight", rawDataActive: iconDataRotateRight, rawDataInactive: iconDataRotateRight, imageAct: null, imageInact: null, animateClicked: true } ];
		this.iconImages.push({ id: "IconMoveObjectOrLight", rawDataActive: iconDataMoveLight, rawDataInactive: iconDataMoveObject, imageAct: null, imageInact: null, animateClicked: false });
		if(enableObjectColorSelection)
		  this.iconImages.push({ id: "IconSelectColor", rawDataActive: iconDataSelectColor, rawDataInactive: iconDataSelectColor, imageAct: null, imageInact: null, animateClicked: false });
		if(enableScale)
		  this.iconImages.push({ id: "IconRule", rawDataActive: iconDataRule, rawDataInactive: iconDataRule, imageAct: null, imageInact: null, animateClicked: true });
		if(enableFlip)
		  this.iconImages.push({ id: "IconFlip", rawDataActive: iconDataFlip, rawDataInactive: iconDataFlip, imageAct: null, imageInact: null, animateClicked: true });
		let iconImages = this.iconImages;
		let icons = [iconImages.length];  //Stores list of {ID, Icon image data}
		let nIconsLoaded = 0; //Track number of loaded icons (images are loaded asynchronously and do not finish in subsequent order)
		let iconRenderer = this.iconRenderer;
		for (let n = 0; n < iconImages.length; ++n)
		{
		  let imageAct = new Image();
		  imageAct.src = "data:image/png;base64," + iconImages[n].rawDataActive;
		  imageAct.onload = function ()
		  {
			iconImages[n].imageAct = imageAct;
			let imageInact = new Image();
			imageInact.src = "data:image/png;base64," + iconImages[n].rawDataInactive;
			imageInact.onload = function ()
			{
			  iconImages[n].imageInact = imageInact;
			  icons[n] = { id: iconImages[n].id, imgActive: imageAct, imgInactive: imageInact, animateClicked: iconImages[n].animateClicked };
			  nIconsLoaded++;
			  if (nIconsLoaded == iconImages.length) //all images loaded, now add the batch to the renderer
			  {
				iconRenderer.addIcons(icons);
				onFinished();
			  }
			}
		  }
		}
	  }
	  else  //images are loaded, add icons
	  {
		let icons = [this.iconImages.length];  //Stores list of {ID, Icon image data}
		for (let n = 0; n < this.iconImages.length; ++n)
		  icons[n] = { id: this.iconImages[n].id, imgActive: this.iconImages[n].imageAct, imgInactive: this.iconImages[n].imageInact, animateClicked: this.iconImages[n].animateClicked };
		this.iconRenderer.addIcons(icons);
		onFinished();
	  }
	}

	//Function loads an image into a texture:
	VisualizationWidget.prototype.loadImageToTexture = function(img, textureType)
	{
	  let gl = this.glContext;
	  //Load texture:
	  switch(textureType)
	  {
		case this.TEXTURE_TYPES.TEXTURE_TYPE_COLOR:
		{
		  this.colorTex.bind();
		  break;
		}
		case this.TEXTURE_TYPES.TEXTURE_TYPE_NORMAL:
		{
		  this.normalTex.bind();
		  break;
		}
		default:
		{
		  throw ('VisualizationWidget::loadImageToTexture(..): Texture type is not implemented!');
		}
	  }
	  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	  //Store new texture size:
	  switch(textureType)
	  {
		case this.TEXTURE_TYPES.TEXTURE_TYPE_COLOR:
		{
		  this.colorImageSize[0] = img.width;
		  this.colorImageSize[1] = img.height;
		  break;
		}
		case this.TEXTURE_TYPES.TEXTURE_TYPE_NORMAL:
		{
		  this.normalImageSize[0] = img.width;
		  this.normalImageSize[1] = img.height;
		  break;
		}
	  }
	  //If normal map was loaded, generate background map:
	  if(textureType == this.TEXTURE_TYPES.TEXTURE_TYPE_NORMAL)
	  {
		let backgroundMapGenerator = new BackgroundMapGenerator();
		let backgroundMapTexData = backgroundMapGenerator.computeBackgroundMapData(img);
		this.backgroundMapTex = new GLTexture(gl, this.normalImageSize[0], this.normalImageSize[1], backgroundMapTexData, gl.TEXTURE_2D, gl.LUMINANCE, gl.LUMINANCE, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
	  }
	  //console.log("VisualizationWidget::loadImageToTexture(..): Texture loaded, type = " + textureType + ", size = " + img.width + " x " + img.height); 
	}

	//Function loads an image into a texture:
	VisualizationWidget.prototype.loadBufferToTexture = function(imgWidth, imgHeight, bufferData, textureType)
	{
	  let gl = this.glContext;
	  //Load texture:
	  switch(textureType)
	  {
		case this.TEXTURE_TYPES.TEXTURE_TYPE_COLOR:
		{
		  this.colorTex.bind();
		  break;
		}
		case this.TEXTURE_TYPES.TEXTURE_TYPE_NORMAL:
		{
		  this.normalTex.bind();
		  break;
		}
		default:
		{
		  throw ('VisualizationWidget::loadBufferToTexture(..): Texture type is not implemented!');
		}
	  }
	  let oldAlignment = gl.getParameter(gl.UNPACK_ALIGNMENT);
	  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, imgWidth, imgHeight, 0, gl.RGB, gl.UNSIGNED_BYTE, bufferData);
	  gl.pixelStorei(gl.UNPACK_ALIGNMENT, oldAlignment);
	  //Store new texture size:
	  switch(textureType)
	  {
		case this.TEXTURE_TYPES.TEXTURE_TYPE_COLOR:
		{
		  this.colorImageSize[0] = imgWidth;
		  this.colorImageSize[1] = imgHeight;
		  break;
		}
		case this.TEXTURE_TYPES.TEXTURE_TYPE_NORMAL:
		{
		  this.normalImageSize[0] = imgWidth;
		  this.normalImageSize[1] = imgHeight;
		  break;
		}
	  }
	  //console.log("VisualizationWidget::loadImageToTexture(..): Texture loaded, type = " + textureType + ", size = " + img.width + " x " + img.height); 
	}

	//Function renders a frame:
	VisualizationWidget.prototype.render = function()
	{
	  let gl = this.glContext;
	  let hasColorTex = this.colorImageSize[0] > 1 && this.colorImageSize[1] > 1? true: false;
	  let hasNormalTex = this.normalImageSize[0] > 1 && this.normalImageSize[1] > 1? true: false;
	  //Set new canvas size, if it is not the current display size in browser:
	  let displaySize = [gl.canvas.clientWidth, gl.canvas.clientHeight];
	  if (gl.canvas.width  != displaySize[0] || gl.canvas.height != displaySize[1]) 
	  { 
		if(hasColorTex)
		{
		  let delta = [gl.canvas.width - displaySize[0], gl.canvas.height - displaySize[1]];
		  this.transformation[12] -= delta[0] / 2;  //X-Translation in Col-Major-Matrix: Add half of extented area
		  this.transformation[13] -= delta[1] / 2;  //Y-Translation in Col-Major-Matrix: Add half of extented area
		}
		gl.canvas.width  = displaySize[0];
		gl.canvas.height = displaySize[1];
		//Initial canvas height is sometimes wrong on Firefox, trigger rendering until canvas height doesn't change anymore:
		{
		  gl.canvas.style.width  = '100%';
		  gl.canvas.style.height  = '100%';
		  this.callbackResize();
		  requestAnimationFrame(() => { this.render() });  //trigger rendering
		}
	  }
	  //Clear buffer(s):
	  gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], this.backgroundColor[3]);
	  gl.clearDepth(1.0);
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	  //There is data of the object avail:
	  if(hasColorTex && hasNormalTex)
	  {
		//Update geometry data:
		if(this.flipHorizontalPercent > 0.0)
		{
		  //100% to 50% is first rotation with 90 degree, 50% to 0% is second rotation with 90 degree:
		  let dx = (this.colorImageSize[0] / 2) * (this.flipHorizontalPercent > 50.0? (1.0 - (this.flipHorizontalPercent - 50.0)/ 50.0): this.flipHorizontalPercent /50.0 );
		  this.updateQuadVBO(0 + dx, this.colorImageSize[0] - dx, 0, this.colorImageSize[1]);
		}
		else if(this.flipVerticalPercent > 0.0)
		{
		  //100% to 50% is first rotation with 90 degree, 50% to 0% is second rotation with 90 degree:
		  let dy = (this.colorImageSize[1] / 2) * (this.flipVerticalPercent > 50.0? (1.0 - (this.flipVerticalPercent - 50.0)/ 50.0): this.flipVerticalPercent /50.0 );
		  this.updateQuadVBO(0, this.colorImageSize[0], 0 + dy, this.colorImageSize[1] - dy);
		}
		else
		  this.updateQuadVBO(0, this.colorImageSize[0], 0, this.colorImageSize[1]);
		//Setup rendering:
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		//Bind shader and textures:
		let shaderInstance = this.gaussKernelHSize == 1? 0: 1;
		this.program[shaderInstance].bind();
		gl.uniform1i(this.shaderLocColorTex[shaderInstance], 0);
		gl.uniform1i(this.shaderLocCubemapTex[shaderInstance], 3);
		gl.uniform1i(this.shaderLocNormalTex[shaderInstance], 1);
		gl.uniform1i(this.shaderLocBackgroundMapTex[shaderInstance], 2);
		gl.activeTexture(gl.TEXTURE0);
		this.colorTex.bind();
		gl.activeTexture(gl.TEXTURE1);
		this.normalTex.bind();
		gl.activeTexture(gl.TEXTURE2);
		this.backgroundMapTex.bind();
		gl.activeTexture(gl.TEXTURE3);
		this.cubemapTex.bind();
		//Set lighting parameter:
		gl.uniform2f(this.shaderLocInputImageSize[shaderInstance], this.colorImageSize[0], this.colorImageSize[1]);
		gl.uniform4f(this.shaderLocAmbient[shaderInstance], this.ambient[0], this.ambient[1], this.ambient[2], this.ambient[3]);
		gl.uniform4f(this.shaderLocBackgroundColor[shaderInstance], this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], this.backgroundColor[3]);
		gl.uniform3f(this.shaderLocDirectionalLightDir[shaderInstance], this.directionalLightDirection[0], this.directionalLightDirection[1], this.directionalLightDirection[2]);
		gl.uniform3f(this.shaderLocDirectionalLightColor[shaderInstance], this.directionalLightColor[0], this.directionalLightColor[1], this.directionalLightColor[2]);
		gl.uniform4f(this.shaderLocFixedMaterialColor[shaderInstance], this.fixedMaterialColor[0], this.fixedMaterialColor[1], this.fixedMaterialColor[2], this.fixedMaterialColor[3]);
		gl.uniform1f(this.shaderLocRoughness[shaderInstance], this.roughness);
		gl.uniform1f(this.shaderLocMetallic[shaderInstance], this.metallic);
		gl.uniform1f(this.shaderLocIndexOfRefraction[shaderInstance], this.indexOfRefraction);
		gl.uniform1f(this.shaderLocDiffusePortion[shaderInstance], this.diffusePortion);
		gl.uniform1f(this.shaderLocEnvironmentReflectance[shaderInstance], this.environmentReflectance);
		let scale = [ Math.sqrt(this.transformation[0] * this.transformation[0] + this.transformation[1] * this.transformation[1] + this.transformation[2] * this.transformation[2]),
					  Math.sqrt(this.transformation[4] * this.transformation[4] + this.transformation[5] * this.transformation[5] + this.transformation[6] * this.transformation[6]),
					  Math.sqrt(this.transformation[8] * this.transformation[8] + this.transformation[9] * this.transformation[9] + this.transformation[10] * this.transformation[10])	];
		let matObjSpaceToWorldSpaceRot = [this.transformation[0] / scale[0], this.transformation[1] / scale[0], this.transformation[2] / scale[0],
										  this.transformation[4] / scale[1], this.transformation[5] / scale[1], this.transformation[6] / scale[1],
										  this.transformation[8] / scale[2], this.transformation[9] / scale[2], this.transformation[10] / scale[2]  ];
		gl.uniformMatrix3fv(this.shaderLocMatObjSpaceToWorldSpaceRot[shaderInstance], false, matObjSpaceToWorldSpaceRot);
		//Set geometry data:
		let size = 2;          //2 components per vertex
		let type = gl.FLOAT;   //32-Bit floats
		let normalize = false; //no data normalization
		let stride = 16;        //stride to next element (number of bytes)
		let offset = 0;        //start of buffer data
		this.vbo.bind();
		gl.vertexAttribPointer(this.shaderLocInVertexPos[shaderInstance], size, type, normalize, stride, offset);
		offset = 8;
		gl.vertexAttribPointer(this.shaderLocInTexCoord[shaderInstance], size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(this.shaderLocInVertexPos[shaderInstance]);
		gl.enableVertexAttribArray(this.shaderLocInTexCoord[shaderInstance]);
		let matMV = new Matrix4f(this.transformation[0], this.transformation[1], this.transformation[2], this.transformation[3],
								 this.transformation[4], this.transformation[5], this.transformation[6], this.transformation[7],
								 this.transformation[8], this.transformation[9], this.transformation[10], this.transformation[11],
								 this.transformation[12], this.transformation[13], this.transformation[14], this.transformation[15]);
		let matMVP = new Matrix4f();
		let left = 0.0, right = gl.canvas.width, bottom = 0.0, top = gl.canvas.height, near = -1.0, far = 1.0;
		matMVP.setOrtho(left, right, bottom, top, near, far);
		matMVP.multiply(matMV);
		gl.uniformMatrix4fv(this.shaderLocMatMVP[shaderInstance], false, matMVP.data);
		//Draw the geometry:
		let primitiveType = gl.TRIANGLE_STRIP;
		offset = 0;
		let count = 4;
		gl.drawArrays(primitiveType, offset, count);
	  }
	  //Render grid:
	  if (this.gridRenderer.blendingFactor > 0.0)
	  {
		let scale = Math.sqrt(this.transformation[0] * this.transformation[0] + this.transformation[1] * this.transformation[1]);
		this.gridRenderer.process(gl.canvas.width, gl.canvas.height, this.pixelToMillimeter, scale);
	  }
	  //Render icons of the UI:
	  this.iconRenderer.render();
	};

	//Function updates VBO with geometry for a quad:
	VisualizationWidget.prototype.updateQuadVBO = function(minX, maxX, minY, maxY)
	{
	  //Data in VBO is already up-to-date:
	  if(this.vboQuadSize && this.vboQuadSize[0] == minX && this.vboQuadSize[1] == maxX && this.vboQuadSize[2] == minY && this.vboQuadSize[3] == maxY)
		return;
	  //Update data:
	  const data = [ minX, minY, 0.0, 1.0,        //PosX, PosY, TexCoordX, TexCoordY
					 minX, maxY, 0.0, 0.0,
					 maxX, minY, 1.0, 1.0,
					 maxX, maxY, 1.0, 0.0];
	  this.vbo.update(new Float32Array(data));
	  //Store dimensions:
	  this.vboQuadSize = [minX, maxX, minY, maxY];
	}

	const embeddedSettings =
	{
	  "Colors":
	  {
		"Light":
		{
		  "Background": [0, 0, 0],
		  "Button": [255, 87, 36],
		  "TooltipText": [2, 2, 2],
		  "ScaleGrid": [0, 74, 149]
		},
		"Dark":
		{
		  "Background": [0, 0, 0],
		  "Button": [255, 87, 36],
		  "TooltipText": [2, 2, 2],
		  "ScaleGrid": [0, 74, 149]
		}
	  },
	  "IconButtonScale": 0.400000,
	  "EnableObjectColorModification": false
	}
	var visWidget;
	var interactionMode = 0;                   //0 = None, 1 = set light direction, 2 = move object
	var script = document.currentScript;       //Initially store the currently processed script (NOTE: When document.currentScript is accessed inside function, it will return null there)
	var mouseWheelZoomAllowed = false;         //Is only avail when the user clicks on the widget (prevent stop when scrolling large website)
	var animation;                             //Stores the values for animation of light or view transformation
	var animationInterval;                     //Interval for animation
	var currentCoinSide = 0;                   //Current visible coin side
	var moveLightOnLeftMouse = 1;              //1 = Move light source with left mouse / single touch, 0 = Move object
	var coinData = null;                       //Json object with complete coin data
	var lastTouchPos = [0, 0];                 //Store position of the last touch event
	var loadOtherSide = false;                 //Flag for loading other side of the object
	var enableObjectColorModification = false; //User can change the color of the object

	//Function enables specific cursor style:
	function enableCursorStyle(cursorStyle)
	{
	  let $canvas = document.getElementById("CANVAS_DIG_OBJ");
	  $canvas.style.cursor = cursorStyle;
	}

	//Function enables a continuous animation (e.g. rotation of light source):
	function enableAnimation()
	{
	  //Render function for the animation:
	  var renderAnimation = function()
	  {
		let viewAlterationEnabledBeforeUpdate = animation.viewAlterationEnabled;
		animation.update();
		if(animation.lightRotationEnabled)
		  visWidget.directionalLightDirection = animation.lightVector.normalized().data;
		if(viewAlterationEnabledBeforeUpdate || animation.viewAlterationEnabled)
		{
		  visWidget.transformation = animation.viewAlterationTransformation.slice();
		  visWidget.directionalLightDirection = animation.lightVector.data.slice();
		  visWidget.directionalLightColor = animation.lightColor.slice();
		  visWidget.environmentReflectance = animation.environmentReflectance;
		  visWidget.fixedMaterialColor = animation.fixedMaterialColor.slice();
		  visWidget.flipHorizontalPercent = animation.viewAlterationFlipHorizontalPercent;
		  visWidget.flipVerticalPercent = animation.viewAlterationFlipVerticalPercent;
		  visWidget.gridRenderer.blendingFactor = animation.viewAlterationScaleGridBlendingFactor;
		  visWidget.gaussKernelHSize = animation.viewAlterationEnabled? 1: 2;  //use smaller kernel for smooth animation
		  if(loadOtherSide &&
			 ( (animation.viewAlterationFlipHorizontal && animation.viewAlterationFlipHorizontalPercent <= 50.0) ||
			   (animation.viewAlterationFlipVertical && animation.viewAlterationFlipVerticalPercent <= 50.0) ) )
		  {
			loadOtherSide = false;
			loadDataset(null, null);
		  }
		}
		visWidget.render();
	  }
	  //Render automatically rotating light at start with only 20 fps (to reduce power consumption):
	  if(animation.lightRotationEnabled)
	  {
		animationInterval = setInterval(function()
		{
		  //Render:
		  renderAnimation();
		  //No further visible changes, stop animation:
		  if(!animation.lightRotationEnabled && !animation.viewAlterationEnabled)
			clearInterval(animationInterval);
		}, 50);
	  }
	  else
	  {
		if(animationInterval != null)
		{
		  clearInterval(animationInterval);
		  animationInterval = null;
		}
		//NOTE: For smooth animation while interacting with the GUI, it is recommended to trigger rendering via requestAnimationFrame(..)-Function (instead of e.g. setInterval(..)-Function).
		var requestNewFrameRendering = true;
		var renderLoop = function()
		{
		  if(requestNewFrameRendering)  //do this at first
			window.requestAnimationFrame(renderLoop);
		  //Render:
		  renderAnimation();
		  //No further visible changes, stop animation:
		  if(!animation.lightRotationEnabled && !animation.viewAlterationEnabled)
			requestNewFrameRendering = false;
		};
		renderLoop();
	  }
	}

	//Function computes default light direction:
	function computeDefaultLightDir()
	{
	  if (coinData != null && coinData["userData"] != null && coinData["userData"]["coinSideData" + currentCoinSide] != null)
	  {
		let userData = coinData["userData"]["coinSideData" + currentCoinSide];
		return [userData["lightDirectionX"], userData["lightDirectionY"], userData["lightDirectionZ"]];
	  }
	  else
		return [0.57, -0.57, -0.57];
	}

	//Function computes default light color:
	function computeDefaultLightColor()
	{
	  if(coinData != null && coinData["userData"] != null && coinData["userData"]["coinSideData" + currentCoinSide] != null)
	  {
		let intensity = coinData["userData"]["coinSideData" + currentCoinSide]["intensity"];
		return [intensity, intensity, intensity];
	  }
	  else
		return [VisualizationWidgetConst.DefaultDirectionalLightColor[0], VisualizationWidgetConst.DefaultDirectionalLightColor[1], VisualizationWidgetConst.DefaultDirectionalLightColor[2]];
	}

	//Function computes transformation for default view:
	function computeDefaultTransformation()
	{
	  let objectCenterPos = [visWidget.colorImageSize[0] / 2, visWidget.colorImageSize[1] / 2];
	  let objectRadius = Math.sqrt(visWidget.colorImageSize[0] * visWidget.colorImageSize[0] + visWidget.colorImageSize[1] * visWidget.colorImageSize[1]) / 2.0;
	  let objectRotation = 0;
	  if (coinData != null && coinData["processData"] != null && coinData["processData"]["coinSide" + currentCoinSide] != null)
	  {
		let processData = coinData["processData"]["coinSide" + currentCoinSide];
		if(processData["centroidX"] != null)
		  objectCenterPos[0] = processData["centroidX"];
		if(processData["centroidY"] != null)
		  objectCenterPos[1] = processData["centroidY"];
		if(processData["maxRadius"] != null)
		  objectRadius = processData["maxRadius"];
		objectRotation = coinData["userData"] != null && coinData["userData"]["coinSideData" + currentCoinSide] != null? coinData["userData"]["coinSideData" + currentCoinSide]["rotation"]: 0;
	  }
	  return visWidget.computeDefaultTransformation(objectCenterPos, objectRadius, objectRotation);
	}

	//Function resets transformation of the object:
	function resetTransformation()
	{
	  visWidget.transformation = computeDefaultTransformation();
	}

	//Function handles click/touch on icon:
	function onIconClick(iconID)
	{
	  //console.log("onIconClick(..): Icon \"" + iconID + "\" clicked.");
	  if(animation.viewAlterationEnabled)  //Cancel animation
		animation.viewAlterationEnabled = false;
	  if(iconID == "IconResetView")
	  {
		animation.lightRotationEnabled = false;
		animation.enableViewAlteration(visWidget.transformation, computeDefaultTransformation(),
									   visWidget.directionalLightDirection, computeDefaultLightDir(),
									   visWidget.directionalLightColor, computeDefaultLightColor(),
									   visWidget.environmentReflectance, VisualizationWidgetConst.DefaultEnvironmentReflectance,
									   visWidget.fixedMaterialColor, [0.0, 0.0, 0.0, 0.0]);
		enableAnimation();  //Triggers also rendering
	  }
	  else if(iconID == "IconZoomIn" || iconID == "IconZoomOut")
	  {
		//Get current scale:
		let currentScale = [  Math.sqrt(visWidget.transformation[0] * visWidget.transformation[0] + visWidget.transformation[1] * visWidget.transformation[1]),
							  Math.sqrt(visWidget.transformation[4] * visWidget.transformation[4] + visWidget.transformation[5] * visWidget.transformation[5]) ];
		//Compute new scale to add:
		let scaleToAdd = [ iconID == "IconZoomOut"? (currentScale[0] > 0.1? 0.5: 1.0): (currentScale[0] < 10.0? 2.0: 1.0),
						   iconID == "IconZoomOut"? (currentScale[1] > 0.1? 0.5: 1.0): (currentScale[1] < 10.0? 2.0: 1.0) ];
		//Use pivot point in the center of the canvas:
		let pivotPoint = [visWidget.glContext.canvas.width / 2, visWidget.glContext.canvas.height / 2];
		animation.enableViewAlteration(visWidget.transformation, visWidget.computeAddedScale(pivotPoint[0], pivotPoint[1], scaleToAdd[0], scaleToAdd[1]),
									   visWidget.directionalLightDirection, visWidget.directionalLightDirection,
									   visWidget.directionalLightColor, visWidget.directionalLightColor,
									   visWidget.environmentReflectance, visWidget.environmentReflectance,
									   visWidget.fixedMaterialColor, visWidget.fixedMaterialColor);
		enableAnimation();  //Triggers also rendering
	  }
	  else if(iconID == "IconRotateLeft" || iconID == "IconRotateRight")
	  {
		let objectCenterPos = [visWidget.colorImageSize[0] / 2, visWidget.colorImageSize[1] / 2];
		if (coinData != null && coinData["processData"] != null && coinData["processData"]["coinSide" + currentCoinSide] != null)
		{
		  let processData = coinData["processData"]["coinSide" + currentCoinSide];
		  if(processData["centroidX"] != null)
			objectCenterPos[0] = processData["centroidX"];
		  if(processData["centroidY"] != null)
			objectCenterPos[1] = processData["centroidY"];
		}
		animation.enableViewAlteration(visWidget.transformation, visWidget.computeAddedRotation(objectCenterPos, iconID == "IconRotateLeft"? 30.0: -30.0),
									   visWidget.directionalLightDirection, visWidget.directionalLightDirection,
									   visWidget.directionalLightColor, visWidget.directionalLightColor,
									   visWidget.environmentReflectance, visWidget.environmentReflectance,
									   visWidget.fixedMaterialColor, visWidget.fixedMaterialColor);
		enableAnimation();  //Triggers also rendering
	  }
	  else if (iconID == "IconFlip")
	  {
		if (coinData != null && coinData["processData"] != null && coinData["processData"]["coinSide1"] != null)
		{
		  let newCoinSide = currentCoinSide == 0 && coinData["processData"]["coinSide1"] ? 1 : 0;
		  if (newCoinSide != currentCoinSide)
		  {        
			currentCoinSide = newCoinSide;
			moveLightOnLeftMouse = 1;
			loadOtherSide = true;
			animation.lightRotationEnabled = false;
			animation.enableViewAlteration(visWidget.transformation, computeDefaultTransformation(),
										   visWidget.directionalLightDirection, computeDefaultLightDir(),
										   visWidget.directionalLightColor, visWidget.directionalLightColor,
										   visWidget.environmentReflectance, visWidget.environmentReflectance,
										   visWidget.fixedMaterialColor, visWidget.fixedMaterialColor);
			if(coinData["userData"] && coinData["userData"]["coinSideRotation"] == 'Vertical')  //flip around vertical axis
			  animation.viewAlterationFlipHorizontal = true;
			else
			  animation.viewAlterationFlipVertical = true;
			enableAnimation();  //Triggers also rendering
		  }
		}
	  }
	  else if(iconID == "IconRule")
	  {
		if (coinData != null && coinData["processData"] != null && coinData["processData"]["coinSide" + currentCoinSide] != null)
		{
		  if(visWidget.gridRenderer.blendingFactor == 0.0)
			animation.viewAlterationScaleGridBlendIn = true;
		  else
			animation.viewAlterationScaleGridBlendOut = true;
		  animation.enableViewAlteration(visWidget.transformation, visWidget.transformation,
										 visWidget.directionalLightDirection, visWidget.directionalLightDirection,
										 visWidget.directionalLightColor, visWidget.directionalLightColor,
										 visWidget.environmentReflectance, visWidget.environmentReflectance,
										 visWidget.fixedMaterialColor, visWidget.fixedMaterialColor);
		  enableAnimation();  //Triggers also rendering
		}
	  }
	  else if(iconID == "IconMoveObjectOrLight")
	  {
		moveLightOnLeftMouse = moveLightOnLeftMouse == 0 ? 1 : 0;
		requestAnimationFrame(() => { visWidget.render() });  //trigger rendering
	  }
	  else if(iconID == "IconSelectColor")
	  {
		//Enable the input:
		let inputRGB = document.getElementById("INPUT_DIG_OBJ_COLOR");
		inputRGB.disabled = false;
		//Bind color manipulation function:
		let setColorFunc = function(event)
		{
		  inputRGB.disabled = true;
		  let red = parseInt(event.target.value.substr(1, 2), 16), green = parseInt(event.target.value.substr(3, 2), 16), blue = parseInt(event.target.value.substr(5, 2), 16);
		  let scaleFactor = 1.0 / 255.0;
		  visWidget.fixedMaterialColor = [scaleFactor * red, scaleFactor * green, scaleFactor * blue, 1.0];
		  visWidget.directionalLightColor = [1.0 - visWidget.ambient[0], 1.0 - visWidget.ambient[1], 1.0 - visWidget.ambient[2]];  //normalize the lighting for good contrast
		  visWidget.environmentReflectance = 0.0;
		  requestAnimationFrame(() => { visWidget.render() });  //trigger rendering
		}
		inputRGB.addEventListener("input", setColorFunc, false);
		inputRGB.addEventListener("change", setColorFunc, false);
		inputRGB.focus();
		inputRGB.click();    
	  }
	}

	//Function handles event for loaded image:
	function onImageLoadedAsync( img)
	{
	  if(img.complete)
	  {
		resetTransformation();
		requestAnimationFrame(() => { visWidget.render() });  //trigger rendering
	  }
	}

	//Function sets new favicon (icon is visible in browser tab):
	function setFavIcon(imageType, imageData)
	{
	  //Setting new fav icon only if visualization is inserted under root and nothing else:
	  if(document.getElementById(script.getAttribute('parent')) === document.body && document.body.childElementCount == 4)
	  {
		let oldFavIcon = document.getElementById('favicon');
		let newFavIcon = document.createElement('link');
		newFavIcon.id = 'favicon';
		newFavIcon.type = imageType;
		newFavIcon.rel = 'icon';
		newFavIcon.href = imageData;
		if(oldFavIcon)
		  document.head.removeChild(oldFavIcon);
		document.head.appendChild(newFavIcon);
	  }
	}

	//Function loads image-file:
	function loadImageAsync(file, textureType)
	{
	  let image = new Image();
	  let imgFormat = file.length > 3 && file[file.length - 4] == 'w' && file[file.length - 3] == 'e' && file[file.length - 2] == 'b' && file[file.length - 1] == 'p'? "webp": "png";
	  image.src = file;
	  image.onload = function()
	  {
		visWidget.loadImageToTexture(image, textureType);
		onImageLoadedAsync(image);
		if(textureType == visWidget.TEXTURE_TYPES.TEXTURE_TYPE_COLOR)   //set new favicon for browser tab
		  setFavIcon('image/' + imgFormat, file);
	  }
	}

	//Function loads png-file:
	function loadBase64ImageAsync(fileData, textureType)
	{
	  let image = new Image();
	  let imgFormat = fileData.length > 5 && fileData[0] == 'U' && fileData[1] == 'k' && fileData[2] == 'l' && fileData[3] == 'G' && fileData[4] == 'R'? "webp": "png";
	  image.src = 'data:image/' + imgFormat + ';base64,' + fileData;
	  image.crossOrigin = "anonymous";	
	  image.onload = function()
	  {
		visWidget.loadImageToTexture(image, textureType);
		onImageLoadedAsync(image);
		if(textureType == visWidget.TEXTURE_TYPES.TEXTURE_TYPE_COLOR)   //set new favicon for browser tab
		  setFavIcon('image/' + imgFormat, image.src);
	  }
	}

	//Function handles event for opening a new dataset:
	function loadDataset(albedoFilename, normalFilename)
	{
	  try
	  {
		visWidget.clearData();
		if(albedoFilename != null && normalFilename != null)
		{
		  loadImageAsync(albedoFilename, visWidget.TEXTURE_TYPES.TEXTURE_TYPE_COLOR);
		  loadImageAsync(normalFilename, visWidget.TEXTURE_TYPES.TEXTURE_TYPE_NORMAL);
		  visWidget.enableIcons(false, false, enableObjectColorModification, function(){requestAnimationFrame(() => { visWidget.render() });});
		}
		else if(coinData != null && coinData["processData"] != null)
		{
		  loadBase64ImageAsync(coinData["processData"]["coinSide" + currentCoinSide]["albedo"], visWidget.TEXTURE_TYPES.TEXTURE_TYPE_COLOR);
		  loadBase64ImageAsync(coinData["processData"]["coinSide" + currentCoinSide]["normal"], visWidget.TEXTURE_TYPES.TEXTURE_TYPE_NORMAL);
		  visWidget.pixelToMillimeter = coinData["processData"]["coinSide" + currentCoinSide]["pixelToMillimeter"];
		  if(coinData["userData"] && coinData["userData"]["coinSideData" + currentCoinSide])
		  {
			let coinSideData = coinData["userData"]["coinSideData" + currentCoinSide];
			let lightVec = new Vector3f(coinSideData["lightDirectionX"], coinSideData["lightDirectionY"], coinSideData["lightDirectionZ"]);
			visWidget.directionalLightDirection = lightVec.normalized().data;
		  }
		  visWidget.directionalLightColor = computeDefaultLightColor();
		  let twoSidedCoin = coinData["processData"] && coinData["processData"]["coinSide1"];
		  let enableScaleVisualization = coinData["processData"] && coinData["processData"]["coinSide0"] && coinData["processData"]["coinSide0"]["pixelToMillimeter"];
		  visWidget.enableIcons(enableScaleVisualization, twoSidedCoin, enableObjectColorModification, function(){requestAnimationFrame(() => { visWidget.render() });});
		}
	  }
	  catch (exception)
	  {
		visWidget.clearData();
		console.log('loadDataset(..): Error:\n' + exception);
	  }
	}

	//Function handles event for loading coin data from json:
	function loadJson(jsonFilename)
	{
	  const getJSON = async url =>
	  {
		try
		{
		  const response = await fetch(url);
		  if(!response.ok)
			throw "loadJson(..): Failed to load json, Error: " + response.statusText;
		  const data = await response.json();
		  return data;
		} 
		catch(error)
		{
		  return error;
		}
	  }
	  getJSON(jsonFilename).then(data =>
	  {
		coinData = data;
		loadDataset(null, null);
	  }).catch(error => 
	  {
		throw error;
	  });
	}

	//Function registers callbacks for image canvas:
	function registerCanvasCallbacks(canvas, visWidget)
	{
	  //Note: Win platform only fires pointer events (and no touch events), Android fires pointer and touch events
	  let isPointer = ('onpointerdown' in window);
	  let isTouch = (('ontouchstart' in window) || navigator.msMaxTouchPoints > 0);
	  //Handle Touch-/Pointer-Event:
	  const handleTouchStartFunction = function(ev, relativeTouchPos)  //relativeTouchPos: origin is bottom left
	  {
		if(animation.isRunningAndNotInterruptible())  //No interaction e.g. while flipping object
		  return;
		if(animation.viewAlterationEnabled)  //Cancel animation
		  animation.viewAlterationEnabled = false;
		animation.lightRotationEnabled = false;	//stop auto light rotation
		if(ev.pointerType && ev.pointerType == "mouse")
		  mouseWheelZoomAllowed = true;  //clicked on canvas, zoom with mouse wheel is now allowed
		if(ev.pointerType && ev.pointerType == "mouse" && ev.which == 3)  //mouse right
		{
		  interactionMode = 2;
		  return;
		}
		let idIcon = visWidget.iconRenderer.hitIcon(relativeTouchPos[0], relativeTouchPos[1], true);
		if(idIcon.length > 0)
		{
		  onIconClick(idIcon);
		  return;
		}
		if(moveLightOnLeftMouse == 1)
		{
		  interactionMode = 1;	
		  let rx = -(relativeTouchPos[0] / visWidget.glContext.canvas.width) * 2.0 + 1.0;
		  let ry = -(relativeTouchPos[1] / visWidget.glContext.canvas.height) * 2.0 + 1.0;
		  let lightVec = new Vector3f(rx, ry, -Math.sqrt(Math.max(0.0, 1.0 - (rx * rx + ry * ry))));
		  visWidget.directionalLightDirection = lightVec.normalized().data;
		  requestAnimationFrame(() => { visWidget.render() });	  
		}
		else
		  interactionMode = 2;
	  };
	  const handleTouchMoveFunction = function(ev, relativeTouchPos, movement)  //relativeTouchPos: origin is bottom left
	  {
		let rect = ev.target.getBoundingClientRect();
		let tooltip = document.getElementById("DIV_DIG_OBJ_ICON_TOOLTIP");
		let hitIconID = visWidget.iconRenderer.hitIcon(ev.clientX - rect.left, rect.bottom - ev.clientY, false);
		if(hitIconID.length > 0)
		{
		  let nIcons = visWidget.iconRenderer.icons? visWidget.iconRenderer.icons.length: 0;
		  let toolTipText = visWidget.iconRenderer.getIconToolTipText(hitIconID);
		  if(nIcons > 0 && toolTipText.length > 0 && ev.pointerType && ev.pointerType == "mouse")
		  {
			const canvasRect = visWidget.glContext.canvas.getBoundingClientRect();
			tooltip.textContent = toolTipText;
			tooltip.style.visibility = 'visible';
			let x = 0, y = 0;
			for(let i = 0; i < nIcons; ++i)
			{
			  x = Math.max(x, visWidget.iconRenderer.iconScale * (visWidget.iconRenderer.icons[i].x + visWidget.iconRenderer.icons[i].w));
			  y = Math.max(y, visWidget.iconRenderer.iconScale * visWidget.iconRenderer.icons[i].y);
			}
			tooltip.style.left = "" + (canvasRect.left + x + 10) + "px";
			tooltip.style.top = "" + (canvasRect.top + visWidget.glContext.canvas.height - 34 - 36 * visWidget.iconRenderer.iconScale) + "px";
			tooltip.style.width = "" + (visWidget.glContext.canvas.width - (x + 10) - 30) + "px"; //adapt width to enable clipping inside canvas
		  }
		  else
			tooltip.style.visibility='hidden';
		  enableCursorStyle("pointer");
		}
		else
		{
		  tooltip.style.visibility='hidden';
		  enableCursorStyle("grab");
		}
		if(interactionMode == 1)  //set new light direction
		{	
		  ev.preventDefault(); //avoid scrolling
		  let rx = -(relativeTouchPos[0] / visWidget.glContext.canvas.width) * 2.0 + 1.0;
		  let ry = -(relativeTouchPos[1] / visWidget.glContext.canvas.height) * 2.0 + 1.0;
		  let lightVec = new Vector3f(rx, ry, -Math.sqrt(Math.max(0.0, 1.0 - (rx * rx + ry * ry))));
		  visWidget.directionalLightDirection = lightVec.normalized().data;
		  requestAnimationFrame(() => { visWidget.render() });
		}
		else if(interactionMode == 2) //move object
		{
		  ev.preventDefault(); //avoid scrolling
		  visWidget.addTranslation(movement[0], -movement[1]);
		  requestAnimationFrame(() => { visWidget.render() });
		}
	  };
	  const handleTouchEndFunction = function()
	  {
		interactionMode = 0;
	  };
	  //Bind callbacks if Pointer-Events are avail:
	  if(isPointer)
	  {
		canvas.onpointerdown = function(ev)
		{
		  const clientRect = ev.target.getBoundingClientRect();
		  const relativeTouchPos = [ev.clientX - clientRect.left, clientRect.bottom - ev.clientY];  //relative pixel position in canvas, origin ist bottom left
		  handleTouchStartFunction(ev, relativeTouchPos);
		  lastTouchPos = [ev.clientX, ev.clientY];
		};
		canvas.onpointermove = function(ev)
		{
		  const clientRect = ev.target.getBoundingClientRect();
		  const relativeTouchPos = [ev.clientX - clientRect.left, clientRect.bottom - ev.clientY];  //relative pixel position in canvas, origin ist bottom left
		  const movement = [ev.clientX - lastTouchPos[0], ev.clientY - lastTouchPos[1]];
		  lastTouchPos = [ev.clientX, ev.clientY];
		  handleTouchMoveFunction(ev, relativeTouchPos, movement);
		};
		canvas.ontouchmove = function(ev) //override default handling of ontouchmove here, otherwise onpointercancel will be triggered to enable scrolling
		{
		  ev.preventDefault();
		}
		canvas.onpointerup = function()
		{ 
		  handleTouchEndFunction();
		};
		canvas.onpointercancel = function()
		{ 
		  handleTouchEndFunction();
		};
	  }
	  //Bind callbacks if Touch-Events are avail:
	  else if(isTouch)
	  {
		canvas.ontouchstart = function(ev)
		{ 
		  const clientRect = ev.touches[0].target.getBoundingClientRect();
		  const relativeTouchPos = [ev.touches[0].clientX - clientRect.left, clientRect.bottom - ev.touches[0].clientY];  //relative pixel position in canvas, origin ist bottom left
		  handleTouchStartFunction(ev, relativeTouchPos);      
		  lastTouchPos = [ev.touches[0].clientX, ev.touches[0].clientY];
		};
		canvas.ontouchmove = function(ev)
		{
		  const clientRect = ev.touches[0].target.getBoundingClientRect();
		  const relativeTouchPos = [ev.touches[0].clientX - clientRect.left, clientRect.bottom - ev.touches[0].clientY];
		  const movement = [ev.touches[0].clientX - lastTouchPos[0], ev.touches[0].clientY - lastTouchPos[1]];
		  lastTouchPos = [ev.touches[0].clientX, ev.touches[0].clientY];
		  handleTouchMoveFunction(ev, relativeTouchPos, movement);
		};
		canvas.ontouchend = function()
		{ 
		  handleTouchEndFunction();
		};
		canvas.ontouchcancel = function()
		{ 
		  handleTouchEndFunction();
		};
	  }
	  else
	  {		
		canvas.onmousedown = function(ev)
		{ 
		  const clientRect = ev.target.getBoundingClientRect();
		  const relativeTouchPos = [ev.clientX - clientRect.left, clientRect.bottom - ev.clientY];
		  ev.pointerType = "mouse";
		  handleTouchStartFunction(ev, relativeTouchPos);
		  mouseWheelZoomAllowed = true;  //zoom with mouse wheel is now allowed
		};
		canvas.onmousemove = function(ev)
		{ 
		  const clientRect = ev.target.getBoundingClientRect();
		  const relativeTouchPos = [ev.clientX - clientRect.left, clientRect.bottom - ev.clientY];
		  const movement = [ev.movementX, ev.movementY];
		  ev.pointerType = "mouse";
		  handleTouchMoveFunction(ev, relativeTouchPos, movement);
		};
		canvas.onmouseup = function()
		{ 
		  handleTouchEndFunction();
		};
		canvas.onmouseenter = function()
		{ 
		  interactionMode = 0;
		  requestAnimationFrame(() => { visWidget.render() });  //trigger rendering
		};
		canvas.onmouseout = function()
		{ 
		  handleTouchEndFunction();
		  mouseWheelZoomAllowed = false;
		  requestAnimationFrame(() => { visWidget.render() });  //trigger rendering
		};       
	  }
	  canvas.addEventListener("wheel", function(ev)
	  { 
		if(animation.isRunningAndNotInterruptible())  //No interaction e.g. while flipping object
		  return;
		if(mouseWheelZoomAllowed)
		{
		  if(animation.viewAlterationEnabled)  //Cancel animation
			animation.viewAlterationEnabled = false;
		  animation.lightRotationEnabled = false;	//stop auto light rotation
		  ev.preventDefault();
		  //Get current scale:
		  let currentScale = [  Math.sqrt(visWidget.transformation[0] * visWidget.transformation[0] + visWidget.transformation[1] * visWidget.transformation[1]),
								Math.sqrt(visWidget.transformation[4] * visWidget.transformation[4] + visWidget.transformation[5] * visWidget.transformation[5]) ];
		  //Compute new scale to add:
		  let wheelSteps = 1; //e.deltaY has +/-3 on Firefox, +/-100 on Chrome, ....
		  let scaleToAdd = [ Math.sign(ev.deltaY) > 0? (currentScale[0] > 0.1? Math.pow(0.9, wheelSteps): 1.0): (currentScale[0] < 10.0? Math.pow(1.1, wheelSteps): 1.0),
							  Math.sign(ev.deltaY) > 0? (currentScale[1] > 0.1? Math.pow(0.9, wheelSteps): 1.0): (currentScale[1] < 10.0? Math.pow(1.1, wheelSteps): 1.0) ];
		  //Compute pivot point which will stay under the mouse position:
		  let rect = ev.target.getBoundingClientRect();
		  let relMousePos = [ev.clientX - rect.left, ev.clientY - rect.top];  //Position within the element            
		  let pivotPoint = [relMousePos[0], visWidget.glContext.canvas.height - relMousePos[1]];
		  visWidget.transformation = visWidget.computeAddedScale(pivotPoint[0], pivotPoint[1], scaleToAdd[0], scaleToAdd[1]);
		  requestAnimationFrame(() => { visWidget.render() });  //trigger rendering
		}
	  }); 
	  animation = new Animation();
	  enableAnimation();
	  visWidget.callbackResize = function()
	  {
		//Position the tooltip:
		let tooltip = document.getElementById("DIV_DIG_OBJ_ICON_TOOLTIP");
			/* Code added by programmfabrik */
			if (!tooltip) {
				// When the tooltip element is no longer in the DOM, it means that it was removed, so we remove the resize event listener
				mainContainer.removeEventListener("resize", resizeFunction);
				return;
			}
			/* -- */
		tooltip.style.visibility='hidden';
		//Position the input element of the color on top left of the canvas:
		let canvasRect = document.getElementById("CANVAS_DIG_OBJ").getBoundingClientRect();
		let inputRGB = document.getElementById("INPUT_DIG_OBJ_COLOR");
		inputRGB.style = "position:absolute;left: " + (canvasRect.left) + "px; top:" + (canvasRect.top) + "px";    
		resetTransformation();
	  }
	  //Set theme:
	  let setTheme = function(theme)
	  {
		let colorBackground = theme == "dark"? [32, 32, 32]: [255, 255, 255];     //Default RGB-Settings
		let colorButton = theme == "dark"? [255, 87, 36]: [255, 87, 36]; // rgb(255 87 36)
		let colorTooltipText = theme == "dark"? [187, 187, 187]: [2, 2, 2];
		let colorScaleGrid = [0, 74, 149];
		if (typeof embeddedSettings !== "undefined")
		{
		  const themeColors = theme == "dark"? embeddedSettings["Colors"]["Dark"]: embeddedSettings["Colors"]["Light"];
		  colorBackground = themeColors["Background"];
		  colorButton = themeColors["Button"];
		  colorTooltipText = themeColors["TooltipText"];
		  colorScaleGrid = themeColors["ScaleGrid"];
		}
		function decimalToHexString(decNumber)
		{
		  let result = decNumber.toString(16).toUpperCase();
		  return result.length == 1? "0" + result: result;
		}
		visWidget.backgroundColor = [(1.0 / 255.0) * colorBackground[0], (1.0 / 255.0) * colorBackground[1], (1.0 / 255.0) * colorBackground[2], 1.0];
		visWidget.iconRenderer.updateTheme(colorButton);
		document.getElementById("DIV_DIG_OBJ_ICON_TOOLTIP").style = "color:#" + decimalToHexString(colorTooltipText[0]) + decimalToHexString(colorTooltipText[1]) + decimalToHexString(colorTooltipText[2]);
		visWidget.gridRenderer.scaleGridColor = [(1.0 / 255.0) * colorScaleGrid[0], (1.0 / 255.0) * colorScaleGrid[1], (1.0 / 255.0) * colorScaleGrid[2], 1.0];
	  }
	  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)  //dark mode enabled in browser
		setTheme("dark");
	  else
		setTheme("light");
	  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e =>  //listen for changes
	  {
		setTheme(e.matches? "dark": "light");
		requestAnimationFrame(() => { visWidget.render() });
	  });
	  //Set additional settings:
	  if (typeof embeddedSettings !== "undefined")
	  {
		visWidget.iconRenderer.iconScale = embeddedSettings["IconButtonScale"];
		enableObjectColorModification = embeddedSettings["EnableObjectColorModification"];
	  }
	}

	/** ViewerMain is not used by the coin plugin made by Programmfabrik */
	//Main function:
	function ViewerMain()
	{
	  try
	  {
		//Insert html and css code:
		let htmlGenerator = new HtmlGenerator();
		let styleSheet = document.createElement("style");
		styleSheet.type = "text/css";
		styleSheet.innerText = htmlGenerator.computeCssCode();
		document.head.appendChild(styleSheet);
		let parentName = script.getAttribute('parent');
		let albedoFilename = script.getAttribute('albedo');
		let normalFilename = script.getAttribute('normal');
		let coinDataFilename = script.getAttribute('coinData');
		document.getElementById(parentName).insertAdjacentHTML('afterbegin', htmlGenerator.computeHtmlCode());
		//Assign elements to widgets:
		canvasLeft = document.querySelector("#CANVAS_DIG_OBJ");
		//Init visualization widget:
		visWidget = new VisualizationWidget(canvasLeft);
		registerCanvasCallbacks(canvasLeft, visWidget);
		window.addEventListener('resize', function()
		{
		  requestAnimationFrame(() => { visWidget.render() });
		});    
		canvasLeft.addEventListener('contextmenu', function(e)  //don't open menu with mouse right click
		{
		  e.preventDefault();
		});
		//load data:
		if(typeof embeddedCoinData !== 'undefined') //data is embedded as json string
		{
		  coinData = embeddedCoinData;
		  loadDataset(null, null);
		}
		else if(coinDataFilename != null)  //data is external json file
		  loadJson(coinDataFilename);
		else
		  loadDataset(albedoFilename, normalFilename);
	  }
	  catch(exception)
	  {
		console.log('Error at ViewerMain(..): ' + exception); //No error, do nothing
	  }
	}
	/*** --- ***/

	/**
	 * Code added by Programmfabrik.
	 */

	var mainContainer;
	var resizeFunction;

	/* Copy of ViewerMain but removing the not necessary stuff by the plugin. */
	function init(container) {
		mainContainer = container;
		//Insert html and css code:
		let htmlGenerator = new HtmlGenerator();

		let styleSheet = document.createElement("style");
		styleSheet.type = "text/css";
		styleSheet.innerText = htmlGenerator.computeCssCode();
		mainContainer.appendChild(styleSheet);

		mainContainer.insertAdjacentHTML('afterbegin', htmlGenerator.computeHtmlCode());
		canvasLeft = mainContainer.querySelector("#CANVAS_DIG_OBJ");
		visWidget = new VisualizationWidget(canvasLeft);
		registerCanvasCallbacks(canvasLeft, visWidget);
		resizeFunction = function() {
			requestAnimationFrame(() => { visWidget.render() });
		};
		window.addEventListener('mousemove', resizeFunction)
		canvasLeft.addEventListener('contextmenu', function(e)  //don't open menu with mouse right click
		{
			e.preventDefault();
		});
	}

	function show(newCoinData) {
		coinData = newCoinData
		loadDataset(null, null);
	}

	return {
		init: init,
		show: show
	};

}();