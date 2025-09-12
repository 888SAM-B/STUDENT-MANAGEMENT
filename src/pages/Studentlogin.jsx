import React from 'react'
import { useEffect,useState } from 'react'
import { replace, useNavigate } from 'react-router-dom'
import './Studentlogin.css';
const Studentlogin = () => {
const url = import.meta.env.VITE_URL
  const [institution, setInstitution] = useState('')
  const [studentdata, setStudentData] = useState({})
  
  useEffect(() => {
      const fetchInstitutions = async () => {
        try {
          const response = await fetch(`${url}/institutions`);
          if (!response.ok) throw new Error('Failed to fetch institutions');
          const institutions = await response.json();
          const institutionSelect = document.getElementById('institution');
          institutions.forEach(inst => {
            const option = document.createElement('option');
            option.value = inst.dbName;
            option.textContent = inst.dbName;
            institutionSelect.appendChild(option);
          });
        } catch (error) {
          console.error('Error fetching institutions:', error);
          alert('Failed to load institutions. Please try again later.');
        }
      };
      fetchInstitutions();
    }, []);

    
     useEffect(() => {
      document.body.style.background = 'linear-gradient(to right, #083f66, #0e204d)';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.fontFamily = '"Roboto Condensed", sans-serif';
    
      return () => {
        document.body.style.background = '';
        document.body.style.margin = '';
        document.body.style.padding = '';
        document.body.style.fontFamily = '';
      };
    }, []);
  const navigate = useNavigate()
  const handleSubmit = (e) => {
    e.preventDefault()
    const rollNumber = e.target.rollNumber.value
    console.log('Roll Number:', rollNumber)
    console.log('Institution:', institution)
   fetch(`${url}/studentLogin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ institution, rollNumber: rollNumber.replace(/\s+/g, '') })
})
  .then(res => {
    if (!res.ok) throw new Error('Login failed');
    return res.json(); // only once!
  })
  .then(response => {
    console.log('Student Data:', response);
    navigate('/studentDashboard', { state: { studentData: response.studentData } });
    alert('Login Successful');
  })
  .catch(err => {
    console.error('Login error:', err);
    alert('Login failed. Please check your details.');
  });


    // Redirect to the staff page after successful login
    // navigate('/staff', { replace: true })
  }
  return (
    <>
        <div className='container4'>
            <h1 className='h13'>Student Login</h1>
            <form  onSubmit={handleSubmit}>
               <select className='se3' id="institution" onChange={(e) => setInstitution(e.target.value)} required>
        <option className='e4' value="">Select Institution</option>
      </select>
                <div className="mb-34">
                    <label htmlFor="rollNumber" className="form-label9">Roll Number</label>
                    <input type="text" className="form-control8" id="rollNumber" name="rollNumber" required />
                </div>
                
            <button type="submit" className="btn btn-primary8" >Login</button>
            </form>
        </div>
    </>
  )
}

export default Studentlogin